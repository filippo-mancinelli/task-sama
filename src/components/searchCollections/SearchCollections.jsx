import React from 'react';
import { useState } from 'react';

const SearchCollections = () => {
  const [searchQuery, setSearchQuery] = useState('');

  function handleSubmit(event){
    event.preventDefault();
  }

  function handleKeyPress(event) {
    if (event.key === 'Enter') {
      handleSubmit(event);
    }
  }

  return (
      <form onSubmit={handleSubmit}>
        <input className='input' type="search" placeholder="Search NFT..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={handleKeyPress} />
      </form>
  )
}

export default SearchCollections
