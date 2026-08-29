import React, { memo, useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import {
  Settings,
  Plus,
  Trash2,
  ChevronDown,
  Check,
  CheckCircle2,
} from 'lucide-react';
import { AddonNodeData, AddonType } from '../../../types/workflow';
import { useWorkflowStore } from '../../../stores/useWorkflowStore';
import { useLLMStore, PROVIDERS_DATA, LLMProvider } from '../../../stores/useLLMStore';
import { useTelephonyStore, TelephonyProvider } from '../../../stores/useTelephonyStore';
import { AddonIcon } from '../../common/AddonIcon';
import { ProviderIcon } from '../../common/ProviderIcon';
import { TelephonyIcon } from '../../common/TelephonyIcon';

export const AddonNode: React.FC<NodeProps<any>> = memo(({ id, data, selected }) => {
  const nodeData = data as AddonNodeData;
  const nodes = useWorkflowStore((s) => s.nodes);
  const edges = useWorkflowStore((s) => s.edges);
  const selectNode = useWorkflowStore((s) => s.selectNode);
  const addChildNode = useWorkflowStore((s) => s.addChildNode);
  const removeNode = useWorkflowStore((s) => s.removeNode);

  // LLM Store
  const {
    provider: llmProvider,
    selectedModels,
    setProvider: setLLMProvider,
    openSetup: openLLMSetup,
  } = useLLMStore();

  // Telephony Store
  const {
    provider: telephonyProvider,
    setProvider: setTelephonyProvider,
    openSetup: openTelephonySetup,
    exotelCallerId,
    twilioPhoneNumber,
  } = useTelephonyStore();

  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showLLMDropdown, setShowLLMDropdown] = useState(false);
  const [showTelephonyDropdown, setShowTelephonyDropdown] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const llmMenuRef = useRef<HTMLDivElement>(null);
  const telephonyMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowAddMenu(false);
      }
      if (llmMenuRef.current && !llmMenuRef.current.contains(event.target as Node)) {
        setShowLLMDropdown(false);
      }
      if (telephonyMenuRef.current && !telephonyMenuRef.current.contains(event.target as Node)) {
        setShowTelephonyDropdown(false);
      }
    };
    if (showAddMenu || showLLMDropdown || showTelephonyDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAddMenu, showLLMDropdown, showTelephonyDropdown]);

  const handleAddChild = (e: React.MouseEvent, type: AddonType, label: string) => {
    e.stopPropagation();
    addChildNode(id, type, label);
    setShowAddMenu(false);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeNode(id);
  };

  const isTrigger = nodeData.addonType === 'trigger';
  const isLLM = nodeData.addonType === 'llm';
  const isFixed = isTrigger || isLLM;

  const currentProviderMeta = PROVIDERS_DATA[llmProvider] || PROVIDERS_DATA.openrouter;
  const activeModelId = selectedModels[llmProvider] || currentProviderMeta.defaultModel;

  // Simple Flat List of LLM Options
  const simpleLLMList: { id: LLMProvider; name: string; modelLabel: string }[] = [
    { id: 'openrouter', name: 'OpenRouter', modelLabel: 'Free Tier (Llama / Mistral)' },
    { id: 'openai', name: 'OpenAI', modelLabel: 'GPT-4o Mini' },
    { id: 'anthropic', name: 'Anthropic', modelLabel: 'Claude 3.5 Sonnet' },
    { id: 'groq', name: 'Groq LPU', modelLabel: 'Llama 3.3 70B' },
    { id: 'gemini', name: 'Google Gemini', modelLabel: 'Gemini 1.5 Flash' },
  ];

  // Simple Flat List of Telephony Options
  const simpleTelephonyList: { id: TelephonyProvider; name: string; number: string }[] = [
    { id: 'exotel', name: 'Exotel Telephony', number: exotelCallerId },
    { id: 'twilio', name: 'Twilio Voice', number: twilioPhoneNumber },
  ];

  const allAddonOptions: { type: AddonType; label: string }[] = [
    { type: 'database', label: 'SQL Database' },
    { type: 'whatsapp', label: 'WhatsApp API' },
    { type: 'gmail', label: 'Gmail OAuth' },
  ];

  // Find all child addon types already connected from this node
  const connectedChildNodeIds = new Set(edges.filter((e) => e.source === id).map((e) => e.target));
  const connectedChildTypes = new Set(
    nodes.filter((n) => connectedChildNodeIds.has(n.id)).map((n) => (n.data as AddonNodeData)?.addonType)
  );

  // Find all existing addon types across the entire workflow graph
  const allExistingTypes = new Set(nodes.map((n) => (n.data as AddonNodeData)?.addonType));

  // Filter out any addons that are already connected or already exist
  const addonOptions = allAddonOptions.filter(
    (opt) =>
      opt.type !== nodeData.addonType &&
      !connectedChildTypes.has(opt.type) &&
      !allExistingTypes.has(opt.type)
  );

  const activeTelephonyLabel = telephonyProvider === 'exotel' ? 'Exotel Telephony' : 'Twilio Voice';
  const activeTelephonyNumber = telephonyProvider === 'exotel' ? exotelCallerId : twilioPhoneNumber;

  const handleSelectLLM = (e: React.MouseEvent, p: LLMProvider) => {
    e.stopPropagation();
    setLLMProvider(p);
    setShowLLMDropdown(false);
  };

  const handleSelectTelephony = (e: React.MouseEvent, tp: TelephonyProvider) => {
    e.stopPropagation();
    setTelephonyProvider(tp);
    setShowTelephonyDropdown(false);
  };

  const handleSettingsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLLM) {
      openLLMSetup(llmProvider);
    } else if (isTrigger) {
      openTelephonySetup(telephonyProvider);
    } else {
      selectNode(id);
    }
  };

  return (
    <div
      onClick={() => selectNode(id)}
      className={`w-[170px] rounded-none backdrop-blur-md transition-all duration-200 cursor-pointer font-sans select-none relative ${
        selected
          ? 'bg-[var(--bg-surface)]/90 border border-[var(--text-main)] shadow-[0_0_15px_rgba(0,0,0,0.25)] dark:shadow-[0_0_20px_rgba(255,255,255,0.1)] ring-1 ring-[var(--text-main)]'
          : 'bg-[var(--bg-surface)]/75 border border-[var(--border-strong)] hover:border-[var(--text-main)] shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]'
      }`}
    >
      {/* Input Handle */}
      {!isTrigger && (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-2 !h-2 !rounded-none !bg-[var(--text-main)] !border-[var(--bg-surface)] !shadow-xs"
        />
      )}

      {/* Glassmorphic Header */}
      <div className="px-2.5 py-2 bg-[var(--bg-input)]/60 backdrop-blur-xs border-b border-[var(--border-subtle)] flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="shrink-0 flex items-center justify-center p-0.5 rounded-none bg-[var(--bg-surface)]/80 border border-[var(--border-subtle)] shadow-2xs">
            {isTrigger ? (
              <TelephonyIcon provider={telephonyProvider} size={12} />
            ) : isLLM ? (
              <ProviderIcon provider={llmProvider} size={12} />
            ) : (
              <AddonIcon type={nodeData.addonType} size={12} />
            )}
          </div>
          <h4 className="text-[10px] font-bold text-[var(--text-main)] truncate leading-tight tracking-tight uppercase">
            {isTrigger ? 'Inbound' : isLLM ? 'LLM Core' : nodeData.label}
          </h4>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-0.5 shrink-0 ml-1">
          <button
            onClick={handleSettingsClick}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-panel)]/80 transition rounded-none"
            title={isLLM ? `Edit ${currentProviderMeta.name} Setup` : isTrigger ? "Edit Telephony Setup" : "Configure Node"}
          >
            <Settings size={11} />
          </button>

          {!isFixed && (
            <button
              onClick={handleRemove}
              className="p-1 text-[var(--text-muted)] hover:text-rose-500 hover:bg-[var(--bg-panel)]/80 transition rounded-none"
              title="Remove"
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Glassmorphic Body */}
      <div className="p-2.5 space-y-2 bg-[var(--bg-surface)]/40">
        {isLLM ? (
          /* SIMPLE LLM LIST DROPDOWN ON CARD */
          <div className="relative" ref={llmMenuRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowLLMDropdown(!showLLMDropdown);
              }}
              className="w-full flex items-center justify-between gap-1.5 px-2 py-1.5 bg-[var(--bg-input)]/80 hover:bg-[var(--bg-panel)] backdrop-blur-xs border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-[9px] font-sans text-[var(--text-main)] transition text-left shadow-2xs group/btn"
              title="Click to select LLM"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <ProviderIcon provider={llmProvider} size={12} />
                <span className="truncate font-semibold tracking-tight">{currentProviderMeta.name}</span>
              </div>
              <ChevronDown
                size={10}
                className={`text-[var(--text-muted)] group-hover/btn:text-[var(--text-main)] shrink-0 transition-transform duration-150 ${
                  showLLMDropdown ? 'rotate-180 text-[var(--text-main)]' : ''
                }`}
              />
            </button>

            {/* FROSTED GLASS VERTICAL LLM LIST */}
            {showLLMDropdown && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute left-0 top-full mt-1.5 w-52 bg-[var(--bg-surface)]/95 backdrop-blur-lg border border-[var(--border-strong)] shadow-2xl p-1 z-50 animate-in fade-in duration-100 font-sans text-[var(--text-main)]"
              >
                <div className="px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border-subtle)] mb-1">
                  Select LLM Provider
                </div>

                <div className="space-y-0.5">
                  {simpleLLMList.map((item) => {
                    const isSelected = llmProvider === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={(e) => handleSelectLLM(e, item.id)}
                        className={`w-full text-left px-2 py-1.5 text-xs flex items-center justify-between transition ${
                          isSelected
                            ? 'bg-[var(--bg-panel)] text-[var(--text-main)] font-semibold border border-[var(--border-strong)]'
                            : 'text-[var(--text-muted)] hover:bg-[var(--bg-input)]/90 hover:text-[var(--text-main)] border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <ProviderIcon provider={item.id} size={13} />
                          <div className="min-w-0">
                            <div className="text-[10px] font-semibold truncate leading-tight">
                              {item.name}
                            </div>
                            <div className="text-[7px] text-[var(--text-faint)] font-mono truncate">
                              {item.modelLabel}
                            </div>
                          </div>
                        </div>

                        {isSelected && <Check size={11} className="text-emerald-500 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : isTrigger ? (
          /* SIMPLE TELEPHONY LIST DROPDOWN ON TRIGGER CARD */
          <div className="relative" ref={telephonyMenuRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowTelephonyDropdown(!showTelephonyDropdown);
              }}
              className="w-full flex items-center justify-between gap-1.5 px-2 py-1.5 bg-[var(--bg-input)]/80 hover:bg-[var(--bg-panel)] backdrop-blur-xs border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-[9px] font-sans text-[var(--text-main)] transition text-left shadow-2xs group/btn"
              title="Click to select Telephony"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <TelephonyIcon provider={telephonyProvider} size={12} />
                <span className="truncate font-semibold tracking-tight">{activeTelephonyLabel}</span>
              </div>
              <ChevronDown
                size={10}
                className={`text-[var(--text-muted)] group-hover/btn:text-[var(--text-main)] shrink-0 transition-transform duration-150 ${
                  showTelephonyDropdown ? 'rotate-180 text-[var(--text-main)]' : ''
                }`}
              />
            </button>

            {/* FROSTED GLASS VERTICAL TELEPHONY LIST */}
            {showTelephonyDropdown && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute left-0 top-full mt-1.5 w-48 bg-[var(--bg-surface)]/95 backdrop-blur-lg border border-[var(--border-strong)] shadow-2xl p-1 z-50 animate-in fade-in duration-100 font-sans text-[var(--text-main)]"
              >
                <div className="px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border-subtle)] mb-1">
                  Select Telephony
                </div>

                <div className="space-y-0.5">
                  {simpleTelephonyList.map((tp) => {
                    const isSelected = telephonyProvider === tp.id;
                    return (
                      <button
                        key={tp.id}
                        type="button"
                        onClick={(e) => handleSelectTelephony(e, tp.id)}
                        className={`w-full text-left px-2 py-1.5 text-xs flex items-center justify-between transition ${
                          isSelected
                            ? 'bg-[var(--bg-panel)] text-[var(--text-main)] font-semibold border border-[var(--border-strong)]'
                            : 'text-[var(--text-muted)] hover:bg-[var(--bg-input)]/90 hover:text-[var(--text-main)] border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <TelephonyIcon provider={tp.id} size={13} />
                          <div className="min-w-0">
                            <div className="text-[10px] font-semibold truncate leading-tight">
                              {tp.name}
                            </div>
                            <div className="text-[7px] text-[var(--text-faint)] font-mono truncate">
                              {tp.number}
                            </div>
                          </div>
                        </div>

                        {isSelected && <Check size={11} className="text-emerald-500 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-[8px] font-mono text-[var(--text-muted)] truncate leading-tight bg-[var(--bg-input)]/80 backdrop-blur-xs px-2 py-1.5 border border-[var(--border-subtle)]">
            {nodeData.configSummary || 'Click to configure'}
          </p>
        )}

        {/* Footer info */}
        <div className="flex items-center justify-between text-[7px] text-[var(--text-faint)] font-mono pt-1 border-t border-[var(--border-subtle)]/50">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            <span className="text-emerald-500 font-semibold uppercase tracking-wider">Ready</span>
          </div>
          <span className="uppercase tracking-wider">{isTrigger ? 'Inbound' : isLLM ? 'Core' : 'Tool'}</span>
        </div>
      </div>

      {/* RIGHT-MIDDLE PLUS CONNECTOR BUTTON */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-30">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowAddMenu(!showAddMenu);
          }}
          className={`w-4 h-4 rounded-none flex items-center justify-center border backdrop-blur-md shadow-sm transition-all ${
            showAddMenu
              ? 'bg-[var(--bg-panel)] text-[var(--text-main)] border-[var(--text-main)] rotate-45 scale-105'
              : 'bg-[var(--bg-surface)]/90 text-[var(--text-muted)] border-[var(--border-strong)] hover:border-[var(--text-main)] hover:text-[var(--text-main)] hover:bg-[var(--bg-input)] hover:scale-105'
          }`}
          title="Connect Tool"
        >
          <Plus size={9} />
        </button>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !rounded-none !bg-[var(--text-main)] !border-[var(--bg-surface)] !shadow-xs"
      />

      {/* COMPACT ADDONS POPOVER MENU (Filters out already connected addons) */}
      {showAddMenu && (
        <div
          ref={menuRef}
          onClick={(e) => e.stopPropagation()}
          className="absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 w-44 rounded-none bg-[var(--bg-surface)]/95 backdrop-blur-lg border border-[var(--border-strong)] shadow-2xl p-1.5 z-50 animate-in fade-in duration-100 font-sans"
        >
          <div className="px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border-subtle)] mb-1 flex items-center justify-between">
            <span>Connect Addon Tool</span>
            <span className="font-mono text-[7px] text-[var(--text-faint)]">+ Node</span>
          </div>

          {addonOptions.length > 0 ? (
            <div className="space-y-0.5">
              {addonOptions.map((opt) => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={(e) => handleAddChild(e, opt.type, opt.label)}
                  className="w-full text-left px-1.5 py-1.5 rounded-none hover:bg-[var(--bg-input)]/90 border border-transparent hover:border-[var(--border-subtle)] transition flex items-center justify-between group/opt"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <AddonIcon type={opt.type} size={12} />
                    <span className="text-[10px] text-[var(--text-main)] font-semibold truncate">
                      {opt.label}
                    </span>
                  </div>
                  <Plus size={9} className="text-[var(--text-muted)] group-hover/opt:text-[var(--text-main)] shrink-0 ml-1" />
                </button>
              ))}
            </div>
          ) : (
            <div className="px-2 py-2 text-center space-y-1">
              <div className="flex items-center justify-center gap-1 text-[9px] text-emerald-500 font-semibold">
                <CheckCircle2 size={11} />
                <span>All Addons Connected</span>
              </div>
              <p className="text-[7px] text-[var(--text-muted)] font-mono">
                No unconnected tool addons remaining
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
AddonNode.displayName = 'AddonNode';
