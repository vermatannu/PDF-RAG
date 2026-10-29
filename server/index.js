import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";
import { Queue } from "bullmq";
import { OllamaEmbeddings, ChatOllama } from "@langchain/ollama";
import { QdrantVectorStore } from "@langchain/qdrant";
import { json } from "stream/consumers";

const queue = new Queue("file-upload-queue", {
  connection: { host: "localhost", port: "6379" },
});

const app = express();

app.use(cors());
app.use(express.json());

// Create uploads directory
const uploadDir = path.join(process.cwd(), "uploads");

// Create folder if it doesn't exist
fs.mkdirSync(uploadDir, { recursive: true });

// Configure Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },

  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

app.get("/", (req, res) => {
  return res.json({ status: "All good" });
});

app.post("/upload/pdf", upload.single("pdf"), async (req, res) => {
  await queue.add(
    "file-ready",
    JSON.stringify({
      filename: req.file.originalname,
      destination: req.file.destination,
      path: req.file.path,
    }),
  );
  if (!req.file) {
    return res.status(400).json({
      message: "No PDF file uploaded",
    });
  }

  return res.json({
    message: "PDF uploaded successfully",
    filename: req.file.filename,
    path: req.file.path,
  });
});

// Retrive vector from db

app.get("/chat", async (req, res) => {
  try {
    const userQuery = req.query.message;

    // Step 1: Initialize embedding model
    const embeddings = new OllamaEmbeddings({
      model: "nomic-embed-text",
      baseUrl: "http://127.0.0.1:11434",
    });

    const llm = new ChatOllama({
      model: "qwen3:4b",
      baseUrl: "http://127.0.0.1:11434",
      temperature: 0,
    });

    // Step 2: Connect to existing Qdrant collection
    const vectorStore = await QdrantVectorStore.fromExistingCollection(
      embeddings,
      {
        url: "http://127.0.0.1:6333",
        collectionName: "langchain-js",
      },
    );

    // Step 3: Create retriever
    const retriever = vectorStore.asRetriever({
      k: 2,
    });

    // Step 4: Retrieve relevant chunks
    const result = await retriever.invoke(userQuery);

    if (result.length === 0) {
      return res.json({
        answer: "No relevant PDF content was found.",
      });
    }

    const context = result.map((doc) => doc.pageContent).join("\n\n");

    const response = await llm.invoke([
      {
        role: "system",
        content: `You are a helpful PDF assistant.
Answer using only the provided PDF context.
If the answer is not in the context, say
"I could not find this information in the PDF."`,
      },
      {
        role: "user",
        content: `Context:
${context}

Question:
${userQuery}`,
      },
    ]);

  //    return res.json({
  //   message: response.choices[0].message.content,
  //   docs: result,
  // });

    return res.json({
      success: true,
      question: userQuery,
      answer: response.content,
    });
  } catch (error) {
    console.error("Chat retrieval error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.listen(8000, () => {
  console.log("Server started on PORT:8000");
});
