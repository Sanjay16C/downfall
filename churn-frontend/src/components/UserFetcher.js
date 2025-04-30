import React, { useState } from 'react';
import axios from 'axios';
import Display from './Display';
import { PulseLoader } from 'react-spinners'; // Added spinner for better UX

const UserFetcher = ({ setProfileUrl }) => {
  const [url, setUrl] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isValidRedditUrl = (url) =>
    /^(https:\/\/www\.reddit\.com\/user\/[A-Za-z0-9_]+)\/?$/.test(url);

  const handleFetch = async () => {
    if (!url.trim()) {
      setError('Please enter a valid Reddit profile URL.');
      return;
    }
    if (!isValidRedditUrl(url)) {
      setError('Invalid Reddit profile URL.');
      return;
    }

    setLoading(true);
    setError('');
    setData(null);

    try {
      const res = await axios.get('http://localhost:8000/user_data/', {
        params: { profile_url: url },
      });

      if (res.data.error) {
        setError(res.data.error);
      } else {
        setData(res.data);
        setProfileUrl(url); // Update parent with the new profile URL
      }
    } catch (err) {
      setError('Failed to fetch data from backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2>🔍 Reddit User Data Viewer</h2>

      <input
        type="text"
        placeholder="Enter Reddit profile URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        style={{ ...styles.input, ...(url && styles.inputFocus) }}
      />

      <button onClick={handleFetch} style={styles.button}>
        Fetch Data
      </button>

      {loading && (
        <div style={styles.spinnerWrapper}>
          <PulseLoader color="#007bff" size={15} />
        </div>
      )}

      {error && <p style={styles.errorMessage}>{error}</p>}

      {!loading && !error && data && <Display data={data} />}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '600px',
    margin: '2rem auto',
    padding: '1rem',
    textAlign: 'center',
    backgroundColor: '#121212',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
  },
  input: {
    padding: '0.8rem',
    width: '80%',
    marginBottom: '1rem',
    borderRadius: '8px',
    border: '1px solid #ccc',
    backgroundColor: '#2a2a2a',
    color: '#fff',
    fontSize: '1rem',
    outline: 'none',
    transition: 'border 0.3s ease',
  },
  inputFocus: {
    borderColor: '#007bff',
  },
  button: {
    padding: '0.8rem 1.5rem',
    borderRadius: '8px',
    border: 'none',
    background: '#007bff',
    color: 'white',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease, transform 0.3s ease',
  },
  errorMessage: {
    color: 'red',
    padding: '0.5rem',
    backgroundColor: '#f8d7da',
    borderRadius: '5px',
    marginTop: '1rem',
  },
  spinnerWrapper: {
    margin: '2rem auto',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
};

export default UserFetcher;