import whisper, os

class SpeechToText:
    def __init__(self, model_size='base'):
        # base = good balance of speed vs accuracy
        # Options: tiny, base, small, medium, large
        print(f'Loading Whisper {model_size} model (first run downloads it)...')
        self.model = whisper.load_model(model_size)
        print('Whisper ready!')

    def transcribe(self, audio_path: str, language=None) -> str:
        if not os.path.exists(audio_path):
            return ''
        result = self.model.transcribe(
            audio_path,
            language=language,  # None = auto-detect
            task='transcribe'
        )
        text = result['text'].strip()
        lang = result.get('language', 'unknown')
        print(f'Heard [{lang}]: {text}')
        return text

if __name__ == '__main__':
    stt = SpeechToText(model_size='base')
    print('Speech-to-text module ready!')
    print('Note: First run will download ~150MB Whisper model')
