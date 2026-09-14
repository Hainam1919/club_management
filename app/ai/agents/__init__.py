"""
Specialized Cognitive AI Agents for Club Management System
"""
from app.ai.agents.mentor_agent import MentorAgent, mentor_agent
from app.ai.agents.strategist_agent import StrategistAgent, strategist_agent
from app.ai.agents.event_architect_agent import EventArchitectAgent, event_architect_agent
from app.ai.agents.media_agent import MediaAgent, media_agent

__all__ = [
    "MentorAgent", "mentor_agent",
    "StrategistAgent", "strategist_agent",
    "EventArchitectAgent", "event_architect_agent",
    "MediaAgent", "media_agent"
]
