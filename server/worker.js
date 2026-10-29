import "dotenv/config";
import { Worker } from "bullmq";
import { QdrantVectorStore } from "@langchain/qdrant";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OllamaEmbeddings } from "@langchain/ollama";

const worker = new Worker(
  "file-upload-queue",
  async (job) => {
    try {
      console.log("Full job data:", job.data);
      console.log("Type:", typeof job.data);

      const data =
        typeof job.data === "string" ? JSON.parse(job.data) : job.data;

      console.time("PDF Loading");
      console.log("PDF path:", data.path);

      if (!data.path) {
        throw new Error("PDF path is missing");
      }

      // Step 1: Load PDF
      const loader = new PDFLoader(data.path);
      const docs = await loader.load();
      console.timeEnd("PDF Loading");

      // Step 2: Split text
      console.time("Text Splitting");
      console.log("PDF pages loaded:", docs.length);

      // Step 2: Split PDF into chunks
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });

      const chunks = await splitter.splitDocuments(docs);

      console.timeEnd("Text Splitting");
      // Step 3: Generate embeddings and store
      console.time("Embedding + Qdrant");
      console.log("Total chunks:", chunks.length);

      if (chunks.length === 0) {
        throw new Error("No text chunks found in PDF");
      }

      // Step 3: Generate embeddings

      const embeddings = new OllamaEmbeddings({
        model: "nomic-embed-text",
        baseUrl: "http://127.0.0.1:11434",
      });

      // Step 4: Store embeddings in Qdrant
      const vectorStore = await QdrantVectorStore.fromDocuments(
        chunks,
        embeddings,
        {
          url: "http://localhost:6333",
          collectionName: "langchain-js",
        },
      );

      console.timeEnd("Embedding + Qdrant");
      

      console.log("All vectors stored successfully!");

      return {
        success: true,
        chunks: chunks.length,
      };
    } catch (error) {
      console.error("PDF processing failed:", error);
      throw error;
    }
  },
  {
    concurrency: 1,
    lockDuration: 120000,
    stalledInterval: 30000,
    maxStalledCount: 2,
    connection: {
      host: "localhost",
      port: 6379,
    },
  },
);

worker.on("completed", (job) => {
  console.log("Job completed:", job.id);
});

worker.on("failed", (job, error) => {
  console.error("Job failed:", job?.id, error.message);
});

worker.on("error", (error) => {
  console.error("Worker error:", error);
});

console.log("PDF worker started...");
