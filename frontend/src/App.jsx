import './App.css'
import Chatbot1 from './chatbot/Chatbot1';
import { BrowserRouter, Route, Routes} from 'react-router-dom'
import Chatbot2 from './chatbot/Chatbot2';
import Chatbot3 from './chatbot/Chatbot3';
import Chatbot4 from './chatbot/Chatbot4';
import Dashboard from './Dashboard';


function App() {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard/>}/>
          <Route path="/chat1" element={<Chatbot1/>}/>
          <Route path="/chat2" element={<Chatbot2/>}/>
          <Route path="/chat3" element={<Chatbot3/>}/>
          <Route path="/chat4" element={<Chatbot4/>}/>
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App;