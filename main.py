# main.py — Entry point for the Banking Voice AI Agent
import os
from dotenv import load_dotenv
load_dotenv()

print('=========================================')
print('   BANKING VOICE AI AGENT')
print('   Powered by ASI:ONE + Fetch.ai')
print('=========================================')
print(f"Bank: {os.getenv('BANK_NAME', 'XYZ Bank')}")
print(f"Port: {os.getenv('AGENT_PORT', 8000)}")
print('Starting agent...')
print()

# Import and run the agent
from agents.voice_agent import bank_agent
bank_agent.run()
