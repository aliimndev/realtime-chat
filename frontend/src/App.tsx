import { useState, useEffect, useRef } from 'react';
import { socket } from './socket';          // value import (socket object)
import type { Message } from './socket';   // type-only import (Message interface)

function App() {
  const [room, setRoom] = useState('');
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socket.connect();

    socket.on('history', (history: Message[]) => setMessages(history));
    socket.on('message', (msg: Message) => setMessages(prev => [...prev, msg]));
    socket.on('typing', (data) => setIsTyping(data.isTyping));

    return () => { socket.disconnect(); };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const joinRoom = () => {
    if (room && username) {
      socket.emit('joinRoom', room);
    }
  };

  const sendMessage = () => {
    if (message.trim() && room) {
      socket.emit('message', { room, username, text: message });
      setMessage('');
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    socket.emit('typing', { room, isTyping: !!e.target.value });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {!room ? (
        <div className="m-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <h1 className="text-3xl font-bold mb-6 text-center">Real-Time Chat Pro</h1>
          <input
            className="w-full p-3 mb-4 border rounded dark:bg-gray-700"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
          <input
            className="w-full p-3 mb-4 border rounded dark:bg-gray-700"
            placeholder="Room name (e.g. gaming, kerja)"
            value={room}
            onChange={e => setRoom(e.target.value)}
          />
          <button onClick={joinRoom} className="w-full p-3 bg-blue-600 text-white rounded hover:bg-blue-700">
            Join Chat
          </button>
        </div>
      ) : (
        <div className="flex flex-1">
          {/* Sidebar online users nanti */}
          <div className="flex-1 flex flex-col">
            <header className="p-4 bg-blue-600 text-white font-bold">Room: {room}</header>
            <div className="flex-1 p-4 overflow-y-auto">
              {messages.map(msg => (
                <div key={msg.id} className={`mb-3 ${msg.username === username ? 'text-right' : 'text-left'}`}>
                  <span className="text-xs text-gray-500">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                  <div className={`inline-block p-3 rounded-lg ${msg.username === username ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                    <strong>{msg.username}: </strong>{msg.text}
                  </div>
                </div>
              ))}
              {isTyping && <p className="text-gray-500 italic">Someone is typing...</p>}
              <div ref={messagesEndRef} />
            </div>
            <footer className="p-4 bg-white dark:bg-gray-800 border-t flex">
              <input
                className="flex-1 p-3 border rounded-l dark:bg-gray-700"
                placeholder="Type a message..."
                value={message}
                onChange={handleTyping}
                onKeyPress={e => e.key === 'Enter' && sendMessage()}
              />
              <button onClick={sendMessage} className="p-3 bg-blue-600 text-white rounded-r">
                Send
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;[{
	"resource": "/home/alee/Destop/real-chat/realtime-chat/frontend/src/App.tsx",
	"owner": "typescript",
	"code": "1484",
	"severity": 8,
	"message": "'Message' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.",
	"source": "ts",
	"startLineNumber": 2,
	"startColumn": 18,
	"endLineNumber": 2,
	"endColumn": 25,
	"modelVersionId": 1,
	"origin": "extHost1"
}]