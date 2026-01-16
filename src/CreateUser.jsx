import { useState } from 'react';

function CreateUser() {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      name: name,
      age: parseInt(age, 10),
      preferences: {} // Default empty preferences
    };

    try {
      const response = await fetch('http://192.168.136.146:3001/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`유저 생성 성공! ID: ${data.id}`);
        setName('');
        setAge('');
      } else {
        console.error('Failed to create user');
        alert('유저 생성 실패');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('에러 발생');
    }
  };

  return (
    <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc' }}>
      <h3>새 유저 생성 (POST /users)</h3>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <label>
            이름: 
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              style={{ marginLeft: '10px' }}
              required
            />
          </label>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>
            나이: 
            <input 
              type="number" 
              value={age} 
              onChange={(e) => setAge(e.target.value)} 
              style={{ marginLeft: '10px' }}
              required
            />
          </label>
        </div>
        <button type="submit">생성하기</button>
      </form>
    </div>
  );
}

export default CreateUser;
