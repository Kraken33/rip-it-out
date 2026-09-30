import React, { useState, useRef, useEffect } from 'react';
import { extractConstruction } from '../services/aiService';
import { parseExtractedConstruction } from '../prompts';
import { addImprovements, findDuplicate } from '../store';

/**
 * ConstructionExtractor wraps a text block or renders selection controls for it,
 * enabling on-demand extraction of phrases into reusable SRS constructions.
 */
export default function ConstructionExtractor({
  sessionId,
  settings = {},
  sourceText = '',
  passage = '',
  children,
  disabled = false,
  className = '',
}) {
  const containerRef = useRef(null);
  const [selectedText, setSelectedText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extracted, setExtracted] = useState(null);
  const [rawResponse, setRawResponse] = useState('');
  const [isUnparsed, setIsUnparsed] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const hasApiKey = Boolean(settings?.openaiApiKey);

  const handleSelectionChange = () => {
    if (disabled || isExtracting || !hasApiKey) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !containerRef.current) {
      return;
    }

    // Check if selection is within our container
    const anchor = sel.anchorNode;
    const focus = sel.focusNode;
    if (
      containerRef.current.contains(anchor) &&
      containerRef.current.contains(focus)
    ) {
      const text = typeof sel.toString === 'function' ? sel.toString().trim() : '';
      if (text) {
        setSelectedText(text);
      }
    }
  };

  const handleExtract = async () => {
    if (!selectedText || isExtracting || disabled) return;
    setIsExtracting(true);
    setErrorMsg('');
    setIsUnparsed(false);
    setRawResponse('');
    setExtracted(null);
    setIsDuplicate(false);
    setIsSaved(false);

    try {
      const raw = await extractConstruction({
        selectedText,
        sourceText: sourceText || selectedText,
        passage,
        settings,
      });

      const parsed = parseExtractedConstruction(raw);
      if (parsed.success && parsed.construction) {
        setExtracted(parsed.construction);
        const dup = await findDuplicate(parsed.construction.construction);
        if (dup) {
          setIsDuplicate(true);
        }
      } else {
        setRawResponse(raw);
        setIsUnparsed(true);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to extract construction.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSave = async () => {
    if (!extracted || isDuplicate || isSaved || !sessionId) return;
    try {
      await addImprovements(sessionId, [
        {
          ...extracted,
          original: '',
          context: sourceText || extracted.improved,
        },
      ]);
      setIsSaved(true);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save to study list.');
    }
  };

  const handleDiscard = () => {
    setExtracted(null);
    setRawResponse('');
    setIsUnparsed(false);
    setErrorMsg('');
    setSelectedText('');
    setIsDuplicate(false);
    setIsSaved(false);
  };

  return (
    <div
      ref={containerRef}
      onMouseUp={handleSelectionChange}
      onKeyUp={handleSelectionChange}
      className={`relative ${className}`}
      data-testid="construction-extractor"
    >
      {children}

      {/* Selection Extraction Trigger Button */}
      {hasApiKey && selectedText && !isExtracting && !extracted && !isUnparsed && !errorMsg && (
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            data-testid="extract-construction-trigger"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleExtract}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-600/90 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg shadow-sm backdrop-blur transition cursor-pointer border border-purple-400/30 animate-fade-in"
          >
            <span>✨</span>
            <span>
              Extract phrase{' '}
              <span className="font-bold underline decoration-purple-300">
                "{selectedText.length > 28 ? selectedText.slice(0, 25) + '...' : selectedText}"
              </span>
            </span>
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setSelectedText('')}
            className="text-gray-400 hover:text-gray-200 text-xs px-1 cursor-pointer"
            title="Dismiss selection"
          >
            ✕
          </button>
        </div>
      )}

      {/* Loading state */}
      {isExtracting && (
        <div
          data-testid="extracting-spinner"
          className="mt-2 text-xs text-purple-300 italic flex items-center gap-2"
        >
          <span className="animate-spin">⏳</span>
          Extracting construction pattern...
        </div>
      )}

      {/* Extracted Construction Preview Card */}
      {extracted && (
        <div
          data-testid="extracted-construction-preview"
          className="mt-3 p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-white space-y-2.5 shadow-lg animate-fade-in"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-wider font-bold text-purple-400">
                Extracted Construction
              </p>
              <p className="text-sm font-extrabold text-purple-200 mt-0.5">
                "{extracted.construction}"
              </p>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-900/60 border border-purple-500/30 text-purple-300 font-medium">
              {extracted.category} · {extracted.spoken_frequency?.replace('_', ' ')}
            </span>
          </div>

          {extracted.improved && (
            <div className="text-xs text-gray-200">
              <span className="text-gray-400">Example: </span>
              <span className="text-emerald-300 font-medium">{extracted.improved}</span>
            </div>
          )}

          {extracted.explanation && (
            <p className="text-xs text-gray-300 leading-relaxed bg-black/20 p-2 rounded-lg border border-white/5">
              {extracted.explanation}
            </p>
          )}

          {isDuplicate && (
            <div
              data-testid="duplicate-warning"
              className="text-xs text-amber-300 bg-amber-950/40 border border-amber-500/30 px-2.5 py-1 rounded-lg"
            >
              ℹ️ Already in your study list.
            </div>
          )}

          {isSaved && (
            <div
              data-testid="saved-indicator"
              className="text-xs text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-lg font-semibold"
            >
              ✓ Added to Study List!
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-1 border-t border-purple-500/20">
            <button
              type="button"
              data-testid="discard-extracted-btn"
              onClick={handleDiscard}
              className="px-3 py-1 text-xs text-gray-400 hover:text-gray-200 transition cursor-pointer"
            >
              Discard
            </button>

            {!isDuplicate && !isSaved && (
              <button
                type="button"
                data-testid="add-extracted-btn"
                onClick={handleSave}
                className="px-3.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow transition cursor-pointer"
              >
                + Add to Study List
              </button>
            )}
          </div>
        </div>
      )}

      {/* Unparsed Fallback Card */}
      {isUnparsed && (
        <div
          data-testid="unparsed-extraction-card"
          className="mt-3 p-3 rounded-xl bg-amber-950/30 border border-amber-600/40 text-white space-y-2 text-xs shadow-lg"
        >
          <p className="font-bold text-amber-400 uppercase tracking-wider text-[10px]">
            Extraction Response (Unparsed)
          </p>
          <p className="text-gray-300 whitespace-pre-wrap">{rawResponse}</p>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleDiscard}
              className="px-2.5 py-1 text-xs text-gray-400 hover:text-gray-200 cursor-pointer"
            >
              Discard
            </button>
            <button
              type="button"
              data-testid="retry-extraction-btn"
              onClick={handleExtract}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {errorMsg && (
        <div
          data-testid="extraction-error"
          className="mt-2 p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-2"
        >
          <span>⚠️ {errorMsg}</span>
          <div className="flex gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleExtract}
              className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded text-[11px] cursor-pointer"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={handleDiscard}
              className="px-2 py-0.5 text-gray-400 hover:text-gray-200 text-[11px] cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
