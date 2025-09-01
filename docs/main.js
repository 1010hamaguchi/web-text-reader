class TextToSpeechApp {
  constructor() {
    this.synth = window.speechSynthesis;
    this.currentUtterance = null;
    this.isPlaying = false;
    this.isPaused = false;
    this.currentText = '';
    this.sentences = [];
    this.currentSentenceIndex = 0;
    this.rate = 1.0;
    this.availableVoices = [];
    this.selectedVoice = null;
    
    this.initializeElements();
    this.setupEventListeners();
    this.loadVoices();
  }

  initializeElements() {
    this.urlInput = document.getElementById('urlInput');
    this.extractBtn = document.getElementById('extractBtn');
    this.contentDiv = document.getElementById('content');
    this.playBtn = document.getElementById('playBtn');
    this.pauseBtn = document.getElementById('pauseBtn');
    this.stopBtn = document.getElementById('stopBtn');
    this.rateSlider = document.getElementById('rateSlider');
    this.rateValue = document.getElementById('rateValue');
    this.voiceSelect = document.getElementById('voiceSelect');
    this.progressBar = document.getElementById('progressBar');
    this.statusDiv = document.getElementById('status');
  }

  setupEventListeners() {
    this.extractBtn.addEventListener('click', () => this.extractContent());
    this.playBtn.addEventListener('click', () => this.playText());
    this.pauseBtn.addEventListener('click', () => this.pauseText());
    this.stopBtn.addEventListener('click', () => this.stopText());
    this.rateSlider.addEventListener('input', (e) => this.updateRate(e.target.value));
    this.voiceSelect.addEventListener('change', (e) => this.selectVoice(e.target.value));
    
    // Enter key support for URL input
    this.urlInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.extractContent();
      }
    });
  }

  loadVoices() {
    const setVoices = () => {
      const voices = this.synth.getVoices();
      this.availableVoices = voices;
      
      // Populate voice selector
      this.populateVoiceSelector();
      
      // Try to find a Japanese female voice first, then any Japanese voice
      this.selectedVoice = voices.find(voice => 
        (voice.lang.includes('ja') || voice.lang.includes('JP')) && 
        voice.name.toLowerCase().includes('female')
      ) || voices.find(voice => 
        voice.lang.includes('ja') || voice.lang.includes('JP')
      ) || voices[0];
      
      // Update selector to show selected voice
      if (this.selectedVoice) {
        this.voiceSelect.value = `system:${this.selectedVoice.name}`;
      }
    };
    
    // Voices might not be loaded immediately
    if (this.synth.getVoices().length !== 0) {
      setVoices();
    } else {
      this.synth.addEventListener('voiceschanged', setVoices);
    }
  }

  populateVoiceSelector() {
    // Clear existing options
    this.voiceSelect.innerHTML = '';
    
    // Add Japanese system voices only
    if (this.availableVoices && this.availableVoices.length > 0) {
      const japaneseVoices = this.availableVoices.filter(voice => 
        voice.lang.includes('ja') || voice.lang.includes('JP')
      );

      if (japaneseVoices.length > 0) {
        const systemGroup = document.createElement('optgroup');
        systemGroup.label = '🔊 日本語音声';
        
        // Sort by name and prioritize female voices
        const sortedJapanese = japaneseVoices.sort((a, b) => {
          const aIsFemale = a.name.toLowerCase().includes('female') || 
                           a.name.toLowerCase().includes('woman') ||
                           a.name.toLowerCase().includes('girl');
          const bIsFemale = b.name.toLowerCase().includes('female') || 
                           b.name.toLowerCase().includes('woman') ||
                           b.name.toLowerCase().includes('girl');
          
          if (aIsFemale && !bIsFemale) return -1;
          if (!aIsFemale && bIsFemale) return 1;
          
          return a.name.localeCompare(b.name);
        });

        sortedJapanese.forEach(voice => {
          const option = document.createElement('option');
          option.value = `system:${voice.name}`;
          option.textContent = `🔊 ${voice.name} ${voice.name.toLowerCase().includes('female') ? '👩' : voice.name.toLowerCase().includes('male') ? '👨' : ''}`;
          systemGroup.appendChild(option);
        });
        this.voiceSelect.appendChild(systemGroup);
      }
    }

    if (this.voiceSelect.children.length === 0) {
      this.voiceSelect.innerHTML = '<option>音声を読み込み中...</option>';
    }
  }

  selectVoice(voiceValue) {
    if (voiceValue.startsWith('system:')) {
      // System voice selection
      const voiceName = voiceValue.replace('system:', '');
      this.selectedVoice = this.availableVoices.find(voice => voice.name === voiceName);
    }
    
    if (this.isPlaying) {
      // If currently playing, restart with new voice
      const currentIndex = this.currentSentenceIndex;
      this.stopText();
      this.currentSentenceIndex = currentIndex;
      this.playText();
    }
  }

  async extractContent() {
    const url = this.urlInput.value.trim();
    if (!url) {
      this.showStatus('URLを入力してください', 'error');
      return;
    }

    try {
      this.showStatus('コンテンツを抽出中...', 'info');
      this.extractBtn.disabled = true;

      // Use AllOrigins proxy service for CORS bypass
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      
      const response = await fetch(proxyUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const htmlContent = data.contents;
      
      // Parse HTML and extract readable content
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      
      // Remove script, style, and other non-content elements
      const elementsToRemove = doc.querySelectorAll('script, style, nav, header, footer, aside, .ad, .advertisement, .sidebar');
      elementsToRemove.forEach(el => el.remove());
      
      // Try to find main content
      let content = '';
      const contentSelectors = [
        'article',
        'main',
        '.content',
        '.post-content',
        '.entry-content',
        '.article-body',
        '.post-body',
        '.markdown-body',
        'body'
      ];
      
      for (const selector of contentSelectors) {
        const element = doc.querySelector(selector);
        if (element) {
          content = element.textContent || element.innerText;
          if (content.trim().length > 100) {
            break;
          }
        }
      }
      
      if (!content || content.trim().length < 50) {
        throw new Error('読み取り可能なコンテンツが見つかりません');
      }
      
      // Clean up the content
      content = content
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, '\n')
        .trim();
      
      const title = doc.querySelector('title')?.textContent || 'ウェブページ';
      
      this.currentText = content;
      this.sentences = this.splitIntoSentences(content);
      this.currentSentenceIndex = 0;
      
      this.displayContent(title, content);
      this.showStatus('抽出完了！再生ボタンを押してください', 'success');
      
      // Enable controls
      this.playBtn.disabled = false;
      this.stopBtn.disabled = false;
      
    } catch (error) {
      console.error('Error:', error);
      let errorMessage = 'コンテンツの抽出に失敗しました';
      
      if (error.message.includes('CORS')) {
        errorMessage = 'このサイトはセキュリティ制限によりアクセスできません';
      } else if (error.message.includes('404')) {
        errorMessage = 'ページが見つかりません';
      } else if (error.message.includes('読み取り可能')) {
        errorMessage = 'このページからは読み取り可能なコンテンツが見つかりません';
      }
      
      this.showStatus(errorMessage, 'error');
    } finally {
      this.extractBtn.disabled = false;
    }
  }

  splitIntoSentences(text) {
    // Split by Japanese sentence endings and common punctuation
    return text.split(/[。！？\n]/g)
               .map(s => s.trim())
               .filter(s => s.length > 0);
  }

  displayContent(title, content) {
    const sentences = this.splitIntoSentences(content);
    this.contentDiv.innerHTML = `
      <h2>${title}</h2>
      <div class="text-content">
        <p class="click-instruction">💡 文章をクリックするとその部分から朗読を開始します</p>
        ${sentences.map((sentence, index) => 
          `<span class="sentence" data-index="${index}" title="クリックして${index + 1}番目の文から再生">${sentence}。</span>`
        ).join(' ')}
      </div>
    `;
    
    // Add click event listeners to sentences
    this.setupSentenceClickListeners();
  }

  setupSentenceClickListeners() {
    const sentenceElements = document.querySelectorAll('.sentence');
    sentenceElements.forEach(element => {
      element.addEventListener('click', (e) => {
        const index = parseInt(e.target.getAttribute('data-index'));
        this.playFromSentence(index);
      });
    });
  }

  playFromSentence(startIndex) {
    // Stop current playback if any
    if (this.isPlaying) {
      this.stopText();
    }
    
    // Set starting position and begin playback
    this.currentSentenceIndex = startIndex;
    this.isPlaying = true;
    this.isPaused = false;
    
    // Show status
    this.showStatus(`${startIndex + 1}番目の文から再生開始...`, 'info');
    
    // Start playing from selected sentence
    this.playNextSentence();
    this.updatePlaybackState();
  }

  playText() {
    if (this.isPaused && this.currentUtterance) {
      this.synth.resume();
      this.isPaused = false;
      this.updatePlaybackState();
      return;
    }

    if (this.isPlaying) return;

    this.isPlaying = true;
    this.currentSentenceIndex = 0;
    this.playNextSentence();
    this.updatePlaybackState();
  }

  playNextSentence() {
    if (this.currentSentenceIndex >= this.sentences.length) {
      this.stopText();
      return;
    }

    const sentence = this.sentences[this.currentSentenceIndex];
    this.currentUtterance = new SpeechSynthesisUtterance(sentence);
    
    // Set voice and rate
    if (this.selectedVoice) {
      this.currentUtterance.voice = this.selectedVoice;
    }
    this.currentUtterance.rate = this.rate;
    
    // Highlight current sentence
    this.highlightSentence(this.currentSentenceIndex);
    
    // Update progress
    this.updateProgress();
    
    this.currentUtterance.onend = () => {
      this.currentSentenceIndex++;
      if (this.isPlaying && this.currentSentenceIndex < this.sentences.length) {
        // Small delay between sentences for better pacing
        setTimeout(() => this.playNextSentence(), 200);
      } else {
        this.stopText();
      }
    };

    this.currentUtterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      this.showStatus('音声再生エラーが発生しました', 'error');
      this.stopText();
    };

    this.synth.speak(this.currentUtterance);
  }

  pauseText() {
    if (this.isPlaying && !this.isPaused) {
      this.synth.pause();
      this.isPaused = true;
      this.updatePlaybackState();
    }
  }

  stopText() {
    this.synth.cancel();
    this.isPlaying = false;
    this.isPaused = false;
    this.currentUtterance = null;
    this.currentSentenceIndex = 0;
    
    // Remove highlights
    this.clearHighlights();
    this.updateProgress();
    this.updatePlaybackState();
  }

  highlightSentence(index) {
    // Clear previous highlights
    this.clearHighlights();
    
    // Highlight current sentence
    const sentence = document.querySelector(`[data-index="${index}"]`);
    if (sentence) {
      sentence.classList.add('highlight');
      // Scroll to current sentence
      sentence.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  clearHighlights() {
    document.querySelectorAll('.sentence.highlight').forEach(el => {
      el.classList.remove('highlight');
    });
  }

  updateProgress() {
    const progress = this.sentences.length > 0 ? 
      (this.currentSentenceIndex / this.sentences.length) * 100 : 0;
    this.progressBar.style.width = `${progress}%`;
  }

  updatePlaybackState() {
    this.playBtn.disabled = this.isPlaying && !this.isPaused;
    this.pauseBtn.disabled = !this.isPlaying || this.isPaused;
    
    if (this.isPlaying && !this.isPaused) {
      this.showStatus('再生中...', 'info');
    } else if (this.isPaused) {
      this.showStatus('一時停止中', 'info');
    } else {
      this.showStatus('停止中', 'success');
    }
  }

  updateRate(value) {
    this.rate = parseFloat(value);
    this.rateValue.textContent = `${this.rate}x`;
    
    // If currently playing, apply new rate to current utterance
    if (this.currentUtterance && this.isPlaying) {
      this.currentUtterance.rate = this.rate;
    }
  }

  showStatus(message, type) {
    this.statusDiv.textContent = message;
    this.statusDiv.className = `status ${type}`;
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const app = new TextToSpeechApp();
  
  // Make app globally available for debugging
  window.ttsApp = app;
});