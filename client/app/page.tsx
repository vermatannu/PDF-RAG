
import { FileUploadComponent } from "./component/file-upload";
import { ChatComponent } from "./component/chat";

export default function Home() {
  return (
    <main className="flex h-screen w-full overflow-hidden bg-slate-950 text-white">

      {/* Left Sidebar - PDF Upload */}
      <aside className="w-[30%] h-full border-r border-slate-800 bg-slate-900/50 p-6 overflow-y-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">
            PDF AI Assistant
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Upload documents and ask questions using AI.
          </p>
        </div>

        <FileUploadComponent />
      </aside>

      {/* Right Section - Chat */}
      <section className="w-[70%] h-full min-w-0">
        <ChatComponent />
      </section>

    </main>
  );
}
