import React from 'react'
import people from '../../assets/people.png';
import ai from '../../assets/ai.png';

const Header = () => {
  return (
    <div className='gpt3_header_section section_padding' id='home'>
      <div className='gpt3_header-content'>
        <p>ciao pollo</p>
        <h1 className='gradient_text'>Let's build something</h1>

        <div className='gpt3_header-content-input'>
          <input type='email' placeholder='Your email'></input>
          <button type='button'>Get Started</button>
        </div> 

        <div className='gpt3_header-content_people'>
          <img src={people} alt='people' />
        </div>

        <div className='gpt3_header-image'>
          <img src={ai} />
        </div>
      </div>
    </div>

  )
}

export default Header