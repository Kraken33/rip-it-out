import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ConstructionExtractor from '../components/ConstructionExtractor';
import * as aiService from '../services/aiService';
import * as store from '../store';

vi.mock('../services/aiService', () => ({
  extractConstruction: vi.fn(),
}));

vi.mock('../store', () => ({
  addImprovements: vi.fn(),
  findDuplicate: vi.fn(),
}));

describe('ConstructionExtractor Component', () => {
  const dummySettings = {
    openaiApiKey: 'sk-test-123',
    openaiModel: 'gpt-4o-mini',
    level: 'intermediate',
  };

  const validExtractionJson = JSON.stringify({
    extraction: {
      construction: 'reach out to [someone]',
      improved: 'I decided to reach out to my friend.',
      explanation: 'Common conversational phrase meaning to contact someone.',
      category: 'collocation',
      spoken_frequency: 'high',
    },
  });

  const mockSelection = (container, text) => {
    const p = container.querySelector('p');
    vi.spyOn(window, 'getSelection').mockReturnValue({
      isCollapsed: false,
      anchorNode: p.firstChild,
      focusNode: p.firstChild,
      toString: () => text,
    });
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('does not display extraction button when no text is selected', () => {
    render(
      <ConstructionExtractor
        sessionId="sess_1"
        settings={dummySettings}
        sourceText="Some source text"
      >
        <p>Some source text</p>
      </ConstructionExtractor>
    );

    expect(screen.queryByTestId('extract-construction-trigger')).toBeNull();
  });

  it('does not display trigger if openaiApiKey is missing', () => {
    const { container } = render(
      <ConstructionExtractor
        sessionId="sess_1"
        settings={{ openaiApiKey: '' }}
        sourceText="Some source text"
      >
        <p>Some source text</p>
      </ConstructionExtractor>
    );

    mockSelection(container, 'source text');
    fireEvent.mouseUp(container.firstChild);
    expect(screen.queryByTestId('extract-construction-trigger')).toBeNull();
  });

  it('captures text selection and triggers extraction on click', async () => {
    aiService.extractConstruction.mockResolvedValueOnce(validExtractionJson);
    store.findDuplicate.mockResolvedValueOnce(null);

    const { container } = render(
      <ConstructionExtractor
        sessionId="sess_1"
        settings={dummySettings}
        sourceText="I invited him over yesterday."
        passage="Вчера я пригласил его в гости."
      >
        <p>I invited him over yesterday.</p>
      </ConstructionExtractor>
    );

    mockSelection(container, 'invited him over');
    fireEvent.mouseUp(container.firstChild);

    const triggerBtn = screen.getByTestId('extract-construction-trigger');
    expect(triggerBtn).toBeDefined();

    fireEvent.click(triggerBtn);

    expect(aiService.extractConstruction).toHaveBeenCalledWith({
      selectedText: 'invited him over',
      sourceText: 'I invited him over yesterday.',
      passage: 'Вчера я пригласил его в гости.',
      settings: dummySettings,
    });

    await waitFor(() => {
      expect(screen.getByTestId('extracted-construction-preview')).toBeDefined();
    });

    expect(screen.getByText('"reach out to [someone]"')).toBeDefined();
    expect(screen.getByText('I decided to reach out to my friend.')).toBeDefined();
    expect(screen.getByText(/Common conversational phrase/)).toBeDefined();
  });

  it('handles duplicate phrases by displaying warning and hiding add button', async () => {
    aiService.extractConstruction.mockResolvedValueOnce(validExtractionJson);
    store.findDuplicate.mockResolvedValueOnce({ id: 'existing_1' });

    const { container } = render(
      <ConstructionExtractor
        sessionId="sess_1"
        settings={dummySettings}
        sourceText="I invited him over yesterday."
      >
        <p>I invited him over yesterday.</p>
      </ConstructionExtractor>
    );

    mockSelection(container, 'invited him over');
    fireEvent.mouseUp(container.firstChild);
    fireEvent.click(screen.getByTestId('extract-construction-trigger'));

    await waitFor(() => {
      expect(screen.getByTestId('duplicate-warning')).toBeDefined();
    });

    expect(screen.queryByTestId('add-extracted-btn')).toBeNull();
  });

  it('saves extracted construction to vault when clicking Add to Study List', async () => {
    aiService.extractConstruction.mockResolvedValueOnce(validExtractionJson);
    store.findDuplicate.mockResolvedValueOnce(null);
    store.addImprovements.mockResolvedValueOnce([]);

    const { container } = render(
      <ConstructionExtractor
        sessionId="sess_1"
        settings={dummySettings}
        sourceText="I invited him over yesterday."
      >
        <p>I invited him over yesterday.</p>
      </ConstructionExtractor>
    );

    mockSelection(container, 'invited him over');
    fireEvent.mouseUp(container.firstChild);
    fireEvent.click(screen.getByTestId('extract-construction-trigger'));

    const addBtn = await screen.findByTestId('add-extracted-btn');
    fireEvent.click(addBtn);

    expect(store.addImprovements).toHaveBeenCalledWith('sess_1', [
      {
        construction: 'reach out to [someone]',
        original: '',
        improved: 'I decided to reach out to my friend.',
        explanation: 'Common conversational phrase meaning to contact someone.',
        category: 'collocation',
        spoken_frequency: 'high',
        context: 'I invited him over yesterday.',
      },
    ]);

    await waitFor(() => {
      expect(screen.getByTestId('saved-indicator')).toBeDefined();
    });

    const doneBtn = screen.getByRole('button', { name: /done/i });
    expect(doneBtn).toBeDefined();
    fireEvent.click(doneBtn);
    expect(screen.queryByTestId('extracted-construction-preview')).toBeNull();
  });

  it('allows consecutive extractions from the same source block after saving', async () => {
    const secondExtractionJson = JSON.stringify({
      extraction: {
        construction: 'catch up on [something]',
        improved: 'We had to catch up on work yesterday.',
        explanation: 'Used to mean doing work that was delayed.',
        category: 'collocation',
        spoken_frequency: 'high',
      },
    });

    aiService.extractConstruction
      .mockResolvedValueOnce(validExtractionJson)
      .mockResolvedValueOnce(secondExtractionJson);
    store.findDuplicate.mockResolvedValue(null);
    store.addImprovements.mockResolvedValue([]);

    const { container } = render(
      <ConstructionExtractor
        sessionId="sess_1"
        settings={dummySettings}
        sourceText="I invited him over yesterday to catch up on work."
      >
        <p>I invited him over yesterday to catch up on work.</p>
      </ConstructionExtractor>
    );

    // 1st extraction
    mockSelection(container, 'invited him over');
    await act(async () => {
      fireEvent.mouseUp(container.firstChild);
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('extract-construction-trigger'));
    });

    const addBtn1 = await screen.findByTestId('add-extracted-btn');
    await act(async () => {
      fireEvent.click(addBtn1);
    });

    await waitFor(() => {
      expect(screen.getByTestId('saved-indicator')).toBeDefined();
    });

    // 2nd extraction from same container without having to reload
    mockSelection(container, 'catch up on work');
    await act(async () => {
      fireEvent.mouseUp(container.firstChild);
    });

    // The previous preview is cleared and the new extract trigger appears
    const trigger2 = await screen.findByTestId('extract-construction-trigger');
    expect(trigger2).toBeDefined();
    await act(async () => {
      fireEvent.click(trigger2);
    });

    expect(aiService.extractConstruction).toHaveBeenLastCalledWith({
      selectedText: 'catch up on work',
      sourceText: 'I invited him over yesterday to catch up on work.',
      passage: '',
      settings: dummySettings,
    });

    const addBtn2 = await screen.findByTestId('add-extracted-btn');
    await act(async () => {
      fireEvent.click(addBtn2);
    });

    expect(store.addImprovements).toHaveBeenCalledTimes(2);
    expect(store.addImprovements).toHaveBeenLastCalledWith('sess_1', [
      {
        construction: 'catch up on [something]',
        original: '',
        improved: 'We had to catch up on work yesterday.',
        explanation: 'Used to mean doing work that was delayed.',
        category: 'collocation',
        spoken_frequency: 'high',
        context: 'I invited him over yesterday to catch up on work.',
      },
    ]);
  });

  it('clears preview when Discard is clicked', async () => {
    aiService.extractConstruction.mockResolvedValueOnce(validExtractionJson);
    store.findDuplicate.mockResolvedValueOnce(null);

    const { container } = render(
      <ConstructionExtractor
        sessionId="sess_1"
        settings={dummySettings}
        sourceText="I invited him over yesterday."
      >
        <p>I invited him over yesterday.</p>
      </ConstructionExtractor>
    );

    mockSelection(container, 'invited him over');
    fireEvent.mouseUp(container.firstChild);
    fireEvent.click(screen.getByTestId('extract-construction-trigger'));

    const discardBtn = await screen.findByTestId('discard-extracted-btn');
    fireEvent.click(discardBtn);

    expect(screen.queryByTestId('extracted-construction-preview')).toBeNull();
  });

  it('shows unparsed card with retry when response is not valid JSON', async () => {
    aiService.extractConstruction.mockResolvedValueOnce('invalid unparsed response');

    const { container } = render(
      <ConstructionExtractor
        sessionId="sess_1"
        settings={dummySettings}
        sourceText="Some text"
      >
        <p>Some text</p>
      </ConstructionExtractor>
    );

    mockSelection(container, 'Some');
    fireEvent.mouseUp(container.firstChild);
    fireEvent.click(screen.getByTestId('extract-construction-trigger'));

    await waitFor(() => {
      expect(screen.getByTestId('unparsed-extraction-card')).toBeDefined();
    });

    expect(screen.getByText('invalid unparsed response')).toBeDefined();
    expect(screen.getByTestId('retry-extraction-btn')).toBeDefined();
  });

  it('surfaces error and provides retry when sessionId is missing during save', async () => {
    aiService.extractConstruction.mockResolvedValueOnce(validExtractionJson);
    store.findDuplicate.mockResolvedValueOnce(null);

    const { container } = render(
      <ConstructionExtractor
        sessionId={null}
        settings={dummySettings}
        sourceText="I invited him over yesterday."
      >
        <p>I invited him over yesterday.</p>
      </ConstructionExtractor>
    );

    mockSelection(container, 'invited him over');
    fireEvent.mouseUp(container.firstChild);
    fireEvent.click(screen.getByTestId('extract-construction-trigger'));

    const addBtn = await screen.findByTestId('add-extracted-btn');
    fireEvent.click(addBtn);

    expect(store.addImprovements).not.toHaveBeenCalled();
    expect(await screen.findByTestId('extraction-error')).toBeDefined();
    expect(screen.getByText(/Session is not ready or active/i)).toBeDefined();
    expect(screen.getByTestId('retry-save-btn')).toBeDefined();
  });

  it('surfaces error and allows retry when addImprovements throws', async () => {
    aiService.extractConstruction.mockResolvedValueOnce(validExtractionJson);
    store.findDuplicate.mockResolvedValueOnce(null);
    store.addImprovements.mockRejectedValueOnce(new Error('Database write rejected'));

    const { container } = render(
      <ConstructionExtractor
        sessionId="sess_1"
        settings={dummySettings}
        sourceText="I invited him over yesterday."
      >
        <p>I invited him over yesterday.</p>
      </ConstructionExtractor>
    );

    mockSelection(container, 'invited him over');
    fireEvent.mouseUp(container.firstChild);
    fireEvent.click(screen.getByTestId('extract-construction-trigger'));

    const addBtn = await screen.findByTestId('add-extracted-btn');
    fireEvent.click(addBtn);

    expect(await screen.findByTestId('extraction-error')).toBeDefined();
    expect(screen.getByText(/Database write rejected/i)).toBeDefined();

    // Now mock resolved for retry
    store.addImprovements.mockResolvedValueOnce([]);
    const retryBtn = screen.getByTestId('retry-save-btn');
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByTestId('saved-indicator')).toBeDefined();
    });
  });

  it('does not dismiss preview card when clicking inside the preview card even with active selection', async () => {
    aiService.extractConstruction.mockResolvedValueOnce(validExtractionJson);
    store.findDuplicate.mockResolvedValueOnce(null);
    store.addImprovements.mockResolvedValueOnce([]);

    const { container } = render(
      <ConstructionExtractor
        sessionId="sess_1"
        settings={dummySettings}
        sourceText="I invited him over yesterday."
      >
        <p>I invited him over yesterday.</p>
      </ConstructionExtractor>
    );

    mockSelection(container, 'invited him over');
    fireEvent.mouseUp(container.firstChild);
    fireEvent.click(screen.getByTestId('extract-construction-trigger'));

    const preview = await screen.findByTestId('extracted-construction-preview');
    expect(preview).toBeDefined();

    // Mouse up on preview card directly
    fireEvent.mouseUp(preview);
    expect(screen.queryByTestId('extracted-construction-preview')).not.toBeNull();

    const addBtn = screen.getByTestId('add-extracted-btn');
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(screen.getByTestId('saved-indicator')).toBeDefined();
    });
    expect(store.addImprovements).toHaveBeenCalledTimes(1);
  });

  it('captures touch text selection via document selectionchange event', async () => {
    aiService.extractConstruction.mockResolvedValueOnce(validExtractionJson);
    store.findDuplicate.mockResolvedValueOnce(null);

    const { container } = render(
      <ConstructionExtractor
        sessionId="sess_1"
        settings={dummySettings}
        sourceText="Mobile touch text selection"
      >
        <p>Mobile touch text selection</p>
      </ConstructionExtractor>
    );

    mockSelection(container, 'touch text');
    act(() => {
      document.dispatchEvent(new Event('selectionchange'));
    });

    const triggerBtn = await screen.findByTestId('extract-construction-trigger');
    expect(triggerBtn).toBeDefined();
    expect(screen.getByText(/"touch text"/i)).toBeDefined();

    // Tap the trigger button (with touch events)
    fireEvent.touchStart(triggerBtn);
    fireEvent.click(triggerBtn);

    await waitFor(() => {
      expect(screen.getByTestId('extracted-construction-preview')).toBeDefined();
    });
  });

  it('clears trigger button when selection is collapsed via selectionchange', async () => {
    const { container } = render(
      <ConstructionExtractor
        sessionId="sess_1"
        settings={dummySettings}
        sourceText="Mobile text selection"
      >
        <p>Mobile text selection</p>
      </ConstructionExtractor>
    );

    mockSelection(container, 'Mobile text');
    act(() => {
      document.dispatchEvent(new Event('selectionchange'));
    });

    expect(await screen.findByTestId('extract-construction-trigger')).toBeDefined();

    // Collapse selection
    vi.spyOn(window, 'getSelection').mockReturnValue({
      isCollapsed: true,
      toString: () => '',
    });

    act(() => {
      document.dispatchEvent(new Event('selectionchange'));
    });

    expect(screen.queryByTestId('extract-construction-trigger')).toBeNull();
  });

  it('isolates selections between multiple extractor instances', async () => {
    const { container } = render(
      <div>
        <div id="first-block">
          <ConstructionExtractor
            sessionId="sess_1"
            settings={dummySettings}
            sourceText="First paragraph text"
          >
            <p className="first-p">First paragraph text</p>
          </ConstructionExtractor>
        </div>
        <div id="second-block">
          <ConstructionExtractor
            sessionId="sess_1"
            settings={dummySettings}
            sourceText="Second paragraph text"
          >
            <p className="second-p">Second paragraph text</p>
          </ConstructionExtractor>
        </div>
      </div>
    );

    const secondP = container.querySelector('.second-p');
    vi.spyOn(window, 'getSelection').mockReturnValue({
      isCollapsed: false,
      anchorNode: secondP.firstChild,
      focusNode: secondP.firstChild,
      toString: () => 'Second paragraph',
    });

    act(() => {
      document.dispatchEvent(new Event('selectionchange'));
    });

    // Only one trigger button should appear in the whole document
    const triggers = screen.getAllByTestId('extract-construction-trigger');
    expect(triggers).toHaveLength(1);
    expect(screen.getByText(/"Second paragraph"/i)).toBeDefined();
  });
});

