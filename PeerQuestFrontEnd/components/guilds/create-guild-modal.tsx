import React from 'react';
import { EnhancedCreateGuildModal } from '@/components/guilds/enhanced-create-guild-modal';

// Dynamic wrapper for future extensibility
export function CreateGuildModal(props: React.ComponentProps<typeof EnhancedCreateGuildModal>) {
  // You can add dynamic logic, hooks, or context here if needed
  return <EnhancedCreateGuildModal {...props} />;
}
