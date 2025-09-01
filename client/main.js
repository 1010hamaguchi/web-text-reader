class TextToSpeechApp {
  constructor() {
    this.synth = window.speechSynthesis;
    this.currentUtterance = null;
    this.currentAudio = null;
    this.isPlaying = false;
    this.isPaused = false;
    this.currentText = '';
    this.sentences = [];
    this.currentSentenceIndex = 0;
    this.rate = 1.0;
    this.useVoicevox = false;
    this.voicevoxSpeakers = [];
    this.selectedVoicevoxSpeaker = null;
    
    this.initializeElements();
    this.setupEventListeners();
    this.loadVoices();
    this.loadVoicevoxSpeakers();
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
        this.voiceSelect.value = this.selectedVoice.name;
      }
    };
    
    // Voices might not be loaded immediately
    if (this.synth.getVoices().length !== 0) {
      setVoices();
    } else {
      this.synth.addEventListener('voiceschanged', setVoices);
    }
  }

  async loadVoicevoxSpeakers() {
    try {
      const response = await fetch('/api/voicevox/speakers');
      if (response.ok) {
        this.voicevoxSpeakers = await response.json();
        this.populateVoiceSelector();
      }
    } catch (error) {
      console.log('VOICEVOX not available, using browser TTS only');
      this.populateVoiceSelector();
    }
  }

  populateVoiceSelector() {
    // Clear existing options
    this.voiceSelect.innerHTML = '';
    
    // Add VOICEVOX voices first if available
    if (this.voicevoxSpeakers && this.voicevoxSpeakers.length > 0) {
      const voicevoxGroup = document.createElement('optgroup');
      voicevoxGroup.label = '🎭 アニメ風音声 (VOICEVOX)';
      
      this.voicevoxSpeakers.forEach(speaker => {
        speaker.styles.forEach(style => {
          const option = document.createElement('option');
          option.value = `voicevox:${speaker.speaker_uuid}:${style.id}`;
          
          // Add emoji based on character type
          let emoji = '🎭';
          const name = speaker.name.toLowerCase();
          if (name.includes('ずんだもん')) emoji = '🍃';
          else if (name.includes('春日部つむぎ')) emoji = '🌸';
          else if (name.includes('雨晴はう')) emoji = '🌧️';
          else if (name.includes('波音リツ')) emoji = '🌊';
          else if (name.includes('玄野武宏')) emoji = '⚡';
          else if (name.includes('白上虎太郎')) emoji = '🐯';
          else if (name.includes('青山龍星')) emoji = '🐲';
          else if (name.includes('冥鳴ひまり')) emoji = '🦉';
          else if (name.includes('九州そら')) emoji = '☁️';
          else if (name.includes('もち子さん')) emoji = '🍡';
          else if (name.includes('剣崎雌雄')) emoji = '⚔️';
          else if (name.includes('WhiteCUL')) emoji = '🤍';
          else if (name.includes('四国めたん')) emoji = '🍊';
          
          option.textContent = `${emoji} ${speaker.name} (${style.name})`;
          voicevoxGroup.appendChild(option);
        });
      });
      this.voiceSelect.appendChild(voicevoxGroup);
      
      // Set default to first VOICEVOX voice
      if (!this.selectedVoicevoxSpeaker && this.voicevoxSpeakers.length > 0) {
        const firstSpeaker = this.voicevoxSpeakers[0];
        const firstStyle = firstSpeaker.styles[0];
        this.selectedVoicevoxSpeaker = {
          uuid: firstSpeaker.speaker_uuid,
          styleId: firstStyle.id,
          name: `${firstSpeaker.name} (${firstStyle.name})`
        };
        this.useVoicevox = true;
        this.voiceSelect.value = `voicevox:${firstSpeaker.speaker_uuid}:${firstStyle.id}`;
      }
    }

    // Add Japanese system voices only
    if (this.availableVoices && this.availableVoices.length > 0) {
      const japaneseVoices = this.availableVoices.filter(voice => 
        voice.lang.includes('ja') || voice.lang.includes('JP')
      );

      if (japaneseVoices.length > 0) {
        const systemGroup = document.createElement('optgroup');
        systemGroup.label = '🔊 システム音声';
        
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
    if (voiceValue.startsWith('voicevox:')) {
      // Parse VOICEVOX voice selection
      const [, uuid, styleId] = voiceValue.split(':');
      const speaker = this.voicevoxSpeakers.find(s => s.speaker_uuid === uuid);
      const style = speaker?.styles.find(s => s.id === parseInt(styleId));
      
      if (speaker && style) {
        this.selectedVoicevoxSpeaker = {
          uuid: uuid,
          styleId: parseInt(styleId),
          name: `${speaker.name} (${style.name})`
        };
        this.useVoicevox = true;
        this.selectedVoice = null;
      }
    } else if (voiceValue.startsWith('system:')) {
      // System voice selection
      const voiceName = voiceValue.replace('system:', '');
      this.selectedVoice = this.availableVoices.find(voice => voice.name === voiceName);
      this.useVoicevox = false;
      this.selectedVoicevoxSpeaker = null;
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

      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      this.currentText = data.content;
      this.sentences = this.splitIntoSentences(data.content);
      this.currentSentenceIndex = 0;
      
      this.displayContent(data.title, data.content);
      this.showStatus('抽出完了！再生ボタンを押してください', 'success');
      
      // Enable controls
      this.playBtn.disabled = false;
      this.stopBtn.disabled = false;
      
    } catch (error) {
      console.error('Error:', error);
      this.showStatus('コンテンツの抽出に失敗しました', 'error');
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
    if (this.isPaused) {
      if (this.currentAudio) {
        this.currentAudio.play();
      } else if (this.currentUtterance) {
        this.synth.resume();
      }
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

  async playNextSentence() {
    if (this.currentSentenceIndex >= this.sentences.length) {
      this.stopText();
      return;
    }

    const sentence = this.sentences[this.currentSentenceIndex];
    
    // Highlight current sentence
    this.highlightSentence(this.currentSentenceIndex);
    
    // Update progress
    this.updateProgress();
    
    if (this.useVoicevox && this.selectedVoicevoxSpeaker) {
      // Use VOICEVOX
      try {
        const response = await fetch('/api/voicevox/synthesis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: sentence,
            speaker: this.selectedVoicevoxSpeaker.styleId
          })
        });

        if (!response.ok) {
          throw new Error('VOICEVOX synthesis failed');
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        this.currentAudio = new Audio(audioUrl);
        this.currentAudio.playbackRate = this.rate;
        
        this.currentAudio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          this.currentSentenceIndex++;
          if (this.isPlaying && this.currentSentenceIndex < this.sentences.length) {
            setTimeout(() => this.playNextSentence(), 200);
          } else {
            this.stopText();
          }
        };

        this.currentAudio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          this.showStatus('VOICEVOX音声再生エラーが発生しました', 'error');
          this.stopText();
        };

        this.currentAudio.play();
        
      } catch (error) {
        console.error('VOICEVOX error:', error);
        this.showStatus('VOICEVOX接続エラー。システム音声に切り替えます。', 'error');
        // Fallback to system TTS
        this.useSystemTTS(sentence);
      }
    } else {
      // Use system TTS
      this.useSystemTTS(sentence);
    }
  }

  useSystemTTS(sentence) {
    this.currentUtterance = new SpeechSynthesisUtterance(sentence);
    
    // Set voice and rate
    if (this.selectedVoice) {
      this.currentUtterance.voice = this.selectedVoice;
    }
    this.currentUtterance.rate = this.rate;
    
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
      if (this.currentAudio) {
        this.currentAudio.pause();
      } else {
        this.synth.pause();
      }
      this.isPaused = true;
      this.updatePlaybackState();
    }
  }

  stopText() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
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

  // Method to jump to specific sentence (for rewind functionality)
  jumpToSentence(index) {
    if (index < 0 || index >= this.sentences.length) return;
    
    if (this.isPlaying) {
      this.synth.cancel();
      this.currentSentenceIndex = index;
      this.playNextSentence();
    } else {
      this.currentSentenceIndex = index;
      this.highlightSentence(index);
      this.updateProgress();
    }
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const app = new TextToSpeechApp();
  
  // Make app globally available for debugging
  window.ttsApp = app;
});