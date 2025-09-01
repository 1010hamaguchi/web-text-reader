import express from 'express';
import cors from 'cors';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

const app = express();
const port = 3020;

app.use(cors());
app.use(express.json());

app.post('/api/extract', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    
    if (!article) {
      return res.status(404).json({ error: 'Could not extract article content' });
    }
    
    res.json({
      title: article.title,
      content: article.textContent,
      excerpt: article.excerpt
    });
    
  } catch (error) {
    console.error('Error extracting content:', error);
    res.status(500).json({ error: 'Failed to extract content from URL' });
  }
});

// VOICEVOX API endpoint
app.post('/api/voicevox/synthesis', async (req, res) => {
  try {
    const { text, speaker } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const speakerId = speaker || 1; // Default to ずんだもん (speaker 1)
    
    // First, get audio query
    const queryResponse = await fetch(`http://localhost:50021/audio_query?text=${encodeURIComponent(text)}&speaker=${speakerId}`, {
      method: 'POST'
    });
    
    if (!queryResponse.ok) {
      throw new Error('VOICEVOX service unavailable. Please start VOICEVOX Engine.');
    }
    
    const queryData = await queryResponse.json();
    
    // Then, synthesize speech
    const synthResponse = await fetch(`http://localhost:50021/synthesis?speaker=${speakerId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(queryData)
    });
    
    if (!synthResponse.ok) {
      throw new Error('Speech synthesis failed');
    }
    
    const audioBuffer = await synthResponse.arrayBuffer();
    
    res.set({
      'Content-Type': 'audio/wav',
      'Content-Length': audioBuffer.byteLength
    });
    
    res.send(Buffer.from(audioBuffer));
    
  } catch (error) {
    console.error('VOICEVOX synthesis error:', error);
    
    if (error.message.includes('VOICEVOX service unavailable')) {
      res.status(503).json({ 
        error: 'VOICEVOX Engine is not running. Please start VOICEVOX Engine first.',
        instructions: 'Download and run VOICEVOX Engine from https://voicevox.hiroshiba.jp/'
      });
    } else {
      res.status(500).json({ error: 'Speech synthesis failed' });
    }
  }
});

// Get available VOICEVOX speakers
app.get('/api/voicevox/speakers', async (req, res) => {
  try {
    const response = await fetch('http://localhost:50021/speakers');
    
    if (!response.ok) {
      throw new Error('VOICEVOX service unavailable');
    }
    
    const speakers = await response.json();
    res.json(speakers);
    
  } catch (error) {
    console.error('Failed to get VOICEVOX speakers:', error);
    res.status(503).json({ 
      error: 'VOICEVOX Engine is not running',
      instructions: 'Download and run VOICEVOX Engine from https://voicevox.hiroshiba.jp/'
    });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log('Note: VOICEVOX features require VOICEVOX Engine to be running on port 50021');
});