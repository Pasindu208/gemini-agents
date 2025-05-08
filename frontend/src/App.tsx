import React, { useState } from 'react';
import './App.css';

function App() {
  const [messages, setMessages] = useState<{ from: string; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userText = input.trim();
    setMessages((msgs) => [...msgs, { from: 'user', text: userText }]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: userText })
      });
      const data = await res.json();
      setMessages((msgs) => [...msgs, { from: 'bot', text: data.message }]);
    } catch (err: any) {
      setMessages((msgs) => [...msgs, { from: 'bot', text: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <h1>Chat with Agent</h1>
      <div className="chat-window">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.from}`}>
            {msg.text}
          </div>
        ))}
        {loading && <div className="message bot">Typing...</div>}
      </div>
      <form onSubmit={handleSubmit} className="input-form">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Enter message..." />
        <button type="submit" disabled={loading}>Send</button>
      </form>
    </div>
  );
}

export default App;
