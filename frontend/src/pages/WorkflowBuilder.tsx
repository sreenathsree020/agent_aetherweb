import React from 'react';
import { WorkflowCanvas } from '../components/workflow/WorkflowCanvas';
import { WorkflowToolbar } from '../components/workflow/WorkflowToolbar';

export const WorkflowBuilder: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden">
      <WorkflowToolbar />
      <div className="flex-1 relative">
        <WorkflowCanvas />
      </div>
    </div>
  );
};
