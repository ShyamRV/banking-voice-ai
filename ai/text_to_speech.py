import pyttsx3, os
from gtts import gTTS

class TextToSpeech:
    def __init__(self, engine='pyttsx3'):
        self.engine_type = engine
        if engine == 'pyttsx3':
            self.engine = pyttsx3.init()
            # Set female voice (index 1 on Windows)
            voices = self.engine.getProperty('voices')
            if len(voices) > 1:
                self.engine.setProperty('voice', voices[1].id)
            self.engine.setProperty('rate', 150)   # Speaking speed
            self.engine.setProperty('volume', 0.9) # Volume 0-1
            print('TTS ready: pyttsx3 (offline mode)')

    def speak(self, text: str, save_file: str = None):
        print(f'Agent says: {text}')
        if self.engine_type == 'pyttsx3':
            if save_file:
                self.engine.save_to_file(text, save_file)
                self.engine.runAndWait()
            else:
                self.engine.say(text)
                self.engine.runAndWait()
        elif self.engine_type == 'gtts':
            tts = gTTS(text=text, lang='en', tld='co.in')  # Indian English
            output = save_file or 'response.mp3'
            tts.save(output)
            os.system(f'start {output}')  # Play on Windows

# Test it
if __name__ == '__main__':
    tts = TextToSpeech(engine='pyttsx3')
    tts.speak('Hello! Thank you for calling XYZ Bank. How may I help you today?')
