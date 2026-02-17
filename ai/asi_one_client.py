import os, requests
from dotenv import load_dotenv
load_dotenv()

class ASIOneClient:
    def __init__(self):
        self.api_key = os.getenv('ASI_ONE_API_KEY')
        self.base_url = 'https://api.asi1.ai/v1'
        self.bank_name = os.getenv('BANK_NAME', 'XYZ Bank')
        if not self.api_key:
            raise ValueError('ASI_ONE_API_KEY not set in .env file!')

    def chat(self, user_message: str, history: list = None) -> str:
        system_prompt = f'''You are a helpful banking AI agent for {self.bank_name}.
        RULES:
        - Always be polite and professional
        - NEVER share passwords or full account numbers
        - If unsure, offer to transfer to a human agent
        - Keep responses short and clear (max 3 sentences)
        - Say 'transfer to agent' if customer is angry or upset
        - Follow RBI compliance guidelines for India
        - Respond in the same language the customer speaks'''

        messages = [{'role': 'system', 'content': system_prompt}]
        if history:
            messages.extend(history)
        messages.append({'role': 'user', 'content': user_message})

        try:
            resp = requests.post(
                f'{self.base_url}/chat/completions',
                headers={'Content-Type': 'application/json',
                         'Authorization': f'Bearer {self.api_key}'},
                json={'model': 'asi1-mini', 'messages': messages,
                      'max_tokens': 300, 'temperature': 0.7},
                timeout=15
            )
            resp.raise_for_status()
            return resp.json()['choices'][0]['message']['content']
        except Exception as e:
            print(f'ASI:ONE Error: {e}')
            return 'I apologise for the inconvenience. Let me transfer you to a human agent.'

# Quick test
if __name__ == '__main__':
    client = ASIOneClient()
    print(client.chat('What is my account balance?'))
