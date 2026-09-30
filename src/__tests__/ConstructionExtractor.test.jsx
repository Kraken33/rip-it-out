import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
});
