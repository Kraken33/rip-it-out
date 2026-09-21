import React from 'react';
import PromptConversationViewerModal from './PromptConversationViewerModal';
import SeamlessChatViewerModal from './SeamlessChatViewerModal';

export default function ConversationViewerModal({ session, improvements = [], onClose }) {
  if (!session) return null;

  if (session.messages && Array.isArray(session.messages) && session.messages.length > 0) {
    return <SeamlessChatViewerModal session={session} onClose={onClose} />;
  }

  return <PromptConversationViewerModal session={session} improvements={improvements} onClose={onClose} />;
}
