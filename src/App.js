import React from 'react'

import { Footer, Header } from './containers';
import Navbar from './components/navbar/Navbar';
import Brand from './components/brand/Brand';
import './App.css';

const App = () => {
  return (
    <div className="App">
        <div className="gradient_bg">
          <Navbar />
          <Header />
        </div>
        <Footer />
    </div>
  )
}

export default App