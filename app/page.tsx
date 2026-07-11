"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { Send, SendHorizontal, User, Loader2, Plus, X, Paperclip, PanelLeft } from "lucide-react";
import { SignInButton, SignUpButton, Show, UserButton } from '@clerk/nextjs';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

const MODELS = [
  { id: "llama-3.1-8b-instant", name: "Llama 3.1 (8B)" },
  { id: "llama-3.3-70b-versatile", name: "Llama 3.3 (70B)" },
  { id: "qwen/qwen3.6-27b", name: "Qwen 3.6 (27B)" },
];

const STORAGE_KEY = "multimodel-chat-history";

export default function ChatPage() {
  const [model, setModel] = useState("llama-3.1-8b-instant");
  const [isMounted, setIsMounted] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [input, setInput] = useState("");
  const { messages, setMessages, sendMessage, status, error } =
    useChat({
      api: `/api/chat?model=${model}`,
    } as any);
  const isLoading = status === 'submitted' || status === 'streaming';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value);

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement> | any) => {
    e?.preventDefault?.();
    if (!input.trim() && !(files && files.length > 0)) return;

    const parts: any[] = [];
    if (input.trim()) {
      parts.push({ type: "text", text: input });
    }

    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          const dataUrl = await readFileAsDataURL(file);
          parts.push({
            type: "image",
            image: dataUrl,
          });
        }
      }
    }

    sendMessage({ id: Math.random().toString(), role: "user", parts });
    setInput("");
    setFiles(null);
  };

  const scrollRef = useRef<HTMLDivElement>(null);

  // Remove local storage logic temporarily to fix corrupted state
  useEffect(() => {
    setIsMounted(true);
    localStorage.removeItem(STORAGE_KEY); // FORCE WIPE
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!isMounted) return null; // Prevent hydration mismatch

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center justify-between pt-4 px-6 bg-transparent">
        <h1 className="font-semibold text-xl tracking-tight text-primary">
          Axomira
        </h1>
        <div className="flex items-center gap-4">

          <div className="flex items-center gap-2">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <Button variant="outline" size="sm">Sign In</Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button size="sm">Sign Up</Button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <UserButton />
            </Show>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <ScrollArea className="flex-1 p-6" viewportRef={scrollRef}>
        <div className="mx-auto max-w-3xl space-y-6 pb-20">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4 text-muted-foreground">
              <img src="/bot.png" alt="AI Bot" className="h-20 w-20 object-contain drop-shadow-lg animate-bounce" style={{ animationDuration: '3s' }} />
              <p>Start a conversation by typing a message below.</p>
              <p className="text-sm">You can switch models anytime without losing context.</p>
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-4 ${m.role === "user" ? "justify-end" : "justify-start"
                  }`}
              >
                {m.role === "assistant" && (
                  <div className="h-8 w-8 shrink-0 rounded-full overflow-hidden border bg-muted flex items-center justify-center">
                    <img src="/bot.png" alt="AI Bot" className="h-full w-full object-cover" />
                  </div>
                )}

                <div
                  className={`rounded-3xl px-5 py-3 max-w-[85%] overflow-hidden ${m.role === "user"
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-muted"
                    }`}
                >
                  <ReactMarkdown
                    rehypePlugins={[rehypeHighlight]}
                  >
                    {(m.parts?.map(p => p.type === 'text' ? p.text : '').join('')) || ''}
                  </ReactMarkdown>
                </div>

                {m.role === "user" && (
                  <Avatar className="h-8 w-8 shrink-0 border bg-secondary text-secondary-foreground">
                    <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex gap-4 justify-start">
              <div className="h-8 w-8 shrink-0 rounded-full overflow-hidden border bg-muted flex items-center justify-center">
                <img src="/bot.png" alt="AI Bot" className="h-full w-full object-cover" />
              </div>
              <div className="rounded-3xl px-5 py-3 bg-muted">
                <div className="flex space-x-1.5 items-center h-5">
                  <div className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {error && (
        <div className="mx-auto max-w-3xl w-full p-4 mb-2 text-center text-sm text-destructive bg-destructive/10 rounded-md">
          {error.message || "An error occurred connecting to the API. Did you add your API keys?"}
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-gradient-to-t from-background via-background/80 to-transparent pb-6 pt-10 mt-auto">

        {/* Attachment Previews */}
        {files && files.length > 0 && (
          <div className="mx-auto max-w-2xl flex gap-2 flex-wrap mb-3 px-2">
            {Array.from(files).map((file, i) => (
              <div key={i} className="relative flex items-center gap-2 bg-secondary/50 rounded-md p-2 text-xs border">
                <Paperclip className="h-3 w-3" />
                <span className="truncate max-w-[100px]">{file.name}</span>
                <button
                  type="button"
                  onClick={() => {
                    const dt = new DataTransfer();
                    Array.from(files).forEach((f, index) => { if (index !== i) dt.items.add(f) });
                    setFiles(dt.files.length > 0 ? dt.files : null);
                  }}
                  className="bg-background/80 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-2xl items-center gap-1.5 relative bg-secondary/30 backdrop-blur-xl border border-border/50 rounded-full shadow-sm p-1 pl-1 transition-all focus-within:bg-secondary/40 focus-within:shadow-md"
        >
          <input
            type="file"
            className="hidden"
            ref={fileInputRef}
            multiple
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                setFiles(e.target.files);
              }
            }}
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-full h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground hover:bg-background/40"
          >
            <Plus className="h-5 w-5" />
            <span className="sr-only">Add attachment</span>
          </Button>
          <Input
            value={input}
            onChange={handleInputChange as any}
            placeholder="Type your message..."
            className="flex-1 bg-transparent !bg-transparent border-0 shadow-none focus-visible:ring-0 text-foreground placeholder:text-muted-foreground/70 px-1 h-9 text-sm"
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={isLoading || !(input || '').trim()}
            size="icon"
            variant="ghost"
            className="rounded-full h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-background/40"
          >
            <SendHorizontal className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
        <div className="mx-auto max-w-3xl mt-3 flex justify-center">
          <button
            type="button"
            onClick={() => setMessages([])}
            className="text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors uppercase tracking-wider font-medium"
          >
            Clear Conversation
          </button>
        </div>
      </div>

      {/* Floating Sidebar Toggle */}
      <Sheet>
        <SheetTrigger className="fixed flex items-center justify-center bottom-6 left-6 h-12 w-12 rounded-full shadow-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 border-border/50 z-50 transition-all hover:scale-105">
          <PanelLeft className="h-5 w-5" />
          <span className="sr-only">Toggle Sidebar</span>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] sm:w-[400px]">
          <SheetHeader>
            <SheetTitle>Chat History</SheetTitle>
          </SheetHeader>
          <div className="py-6 flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Your previous conversations will appear here.
            </p>
            {/* Placeholder history items */}
            <div className="flex flex-col gap-2">
              <div className="p-3 bg-secondary/30 rounded-md text-sm truncate hover:bg-secondary/50 cursor-pointer transition-colors">
                explain me networking
              </div>
              <div className="p-3 bg-secondary/30 rounded-md text-sm truncate hover:bg-secondary/50 cursor-pointer transition-colors">
                which is best movie and popular in india
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
