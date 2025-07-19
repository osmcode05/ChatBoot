import { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Button,
  Card,
  InputGroup,
  FormControl,
  Container,
  Alert,
  Spinner,
} from "react-bootstrap";
import { Robot, PlusCircle, Send } from "react-bootstrap-icons";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messageEndRef = useRef(null);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { content: input, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post("/api/gemini-proxy", {
        contents: [
          ...messages.map((msg) => ({
            role: msg.sender === "user" ? "user" : "model",
            parts: [{ text: msg.content }],
          })),
          {
            role: "user",
            parts: [{ text: input }],
          },
        ],
      });

      const aiContent =
        response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "No response from AI.";

      setMessages((prev) => [...prev, { content: aiContent, sender: "bot" }]);
    } catch (err) {
      console.error("Error:", err);
      setError(err.response?.data?.error || err.message || "Request failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Container fluid className="d-flex flex-column vh-100 p-0 bg-light">
      <nav className="navbar navbar-light bg-white border-bottom shadow-sm p-2">
        <span className="navbar-brand fw-bold fst-italic">
          <Robot size={24} className="me-2" /> OSM Chatbot
        </span>
        <Button variant="primary" onClick={() => setMessages([])}>
          <PlusCircle size={20} className="me-1" /> New Chat
        </Button>
      </nav>

      <div className="flex-grow-1 overflow-auto p-3">
        {messages.length === 0 && (
          <div className="h-100 d-flex flex-column align-items-center justify-content-center text-muted">
            <div style={{ fontSize: "48px" }} className="mb-3">
              <Robot size={48} />
            </div>
            <h4 className="text-center fw-bold">
              Hello I'm OSM AI <br /> How can I help you today?
            </h4>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`d-flex mb-3 ${
              msg.sender === "user"
                ? "justify-content-end"
                : "justify-content-start"
            }`}
          >
            {msg.sender === "bot" && (
              <span className="text-secondary mt-1 me-2">
                <Robot size={24} />
              </span>
            )}
            <Card
              className={
                msg.sender === "user"
                  ? "bg-primary text-white"
                  : "bg-white border"
              }
              style={{ maxWidth: "75%" }}
            >
              <Card.Body className="p-2">
                {msg.content.split("\n").map((paragraph, idx) => (
                  <p key={idx} className="mb-0">
                    {paragraph}
                  </p>
                ))}
              </Card.Body>
            </Card>
            {msg.sender === "user" && (
              <span className="text-primary mt-1 ms-2">👤</span>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="d-flex mb-3 justify-content-start">
            <span className="text-secondary me-2">
              <Robot size={24} />
            </span>
            <Card className="bg-white border">
              <Card.Body className="p-2">
                <Spinner animation="border" size="sm" className="me-2" />
                Thinking...
              </Card.Body>
            </Card>
          </div>
        )}
        <div ref={messageEndRef} />
      </div>

      <div className="border-top p-3 bg-white">
        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}
        <InputGroup>
          <FormControl
            as="textarea"
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            disabled={isLoading}
            className="shadow-none"
            style={{ resize: "none" }}
          />
          <Button
            variant="primary"
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? (
              <>
                <Spinner animation="grow" size="sm" />
              </>
            ) : (
              <Send />
            )}
          </Button>
        </InputGroup>
      </div>
    </Container>
  );
}

export default App;
