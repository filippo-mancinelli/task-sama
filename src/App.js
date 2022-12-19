import React from 'react'

import { Footer, Header } from './containers';
import Navbar from './components/navbar/Navbar';
import './App.css';

const App = () => {
  return (
    <div className="App">
        <div>
          <Navbar />
          <Header />
        </div>
        <Footer />
    </div>
  )
}

export default App