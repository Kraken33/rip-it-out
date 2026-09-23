import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Session from '../screens/Session';
import { clearAllData, createSession, updateSettings, getImprovements, getSessions } from '../store';

vi.mock('../supabaseClient', () => ({
  supabase: null,
  isSupabaseConfigured: false,
}));

const mocks = vi.hoisted(() => ({
  generateTranslationStoryPassage: vi.fn(),
  evaluateTranslationStory: vi.fn(),
}));

vi.mock('../services/aiService', async (importActual) => {
  const actual = await importActual();
  return {
    ...actual,
    generateTranslationStoryPassage: mocks.generateTranslationStoryPassage,
    evaluateTranslationStory: mocks.evaluateTranslationStory,
  };
});

vi.mock('../components/AudioRecorder', () => ({
  default: ({ onTranscribed }) => (
    <button type="button" onClick={() => onTranscribed('dictated text')}>
      Simulate dictation
    </button>
  ),
}));

describe('Session Wizard Component', () => {
  beforeEach(async () => {
    await clearAllData();
  });

  it('renders Step 1 form correctly', () => {
    render(
      <BrowserRouter>
        <Session />
      </BrowserRouter>
    );

    expect(screen.getByText(/New Practice Session/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Atomic Habits/i)).toBeInTheDocument();
  });

  it('submits Step 1 form and advances to Step 2 with Prompt #1', async () => {
    render(
      <BrowserRouter>
        <Session />
      </BrowserRouter>
    );

    const titleInput = screen.getByPlaceholderText(/Atomic Habits/i);
    fireEvent.change(titleInput, { target: { value: 'My Video Session' } });

    const videoButton = screen.getByText('Video');
    fireEvent.click(videoButton);

    const submitBtn = screen.getByRole('button', { name: /(Generate Prompt #1|Start Seamless Voice Session)/i });
    fireEvent.click(submitBtn);

    // createSession is now async, so wait for step 2 content
    await waitFor(() =>
      expect(screen.getByText(/(Seamless AI Coach|Seamless Voice Session|Step 1: Describe Content)/i)).toBeInTheDocument()
    );
    expect(screen.getAllByText(/My Video Session/i)[0]).toBeInTheDocument();
  });

  it('autofills previous session details when selecting a title from dropdown', async () => {
    await createSession({ title: 'Previous Session', sourceType: 'book', tags: ['habits'], notes: 'book note' });

    const { container } = render(
      <BrowserRouter>
        <Session />
      </BrowserRouter>
    );

    await waitFor(() => {
      const selector = container.querySelector('#select-prev-title');
      expect(selector).toBeTruthy();
    });

    const selector = container.querySelector('#select-prev-title');
    fireEvent.change(selector, { target: { value: 'Previous Session' } });

    expect(screen.getByPlaceholderText(/Atomic Habits/i)).toHaveValue('Previous Session');
    expect(screen.getByPlaceholderText(/productivity/i)).toHaveValue('habits');
  });

  describe('Step 4 selective import picker', () => {
    const IMPORT_JSON = JSON.stringify({
      improvements: [
        {
          construction: 'invite [someone] over',
          original: 'invited him home',
          improved: 'invited him over',
          explanation: 'natural phrasing',
          category: 'collocation',
          spoken_frequency: 'high',
        },
        {
          construction: 'catch up on',
          original: 'caught up',
          improved: 'catch up on work',
          explanation: 'phrasal verb',
          category: 'vocabulary',
          spoken_frequency: 'medium',
        },
      ],
    });

    const driveToStep4 = async () => {
      render(
        <BrowserRouter>
          <Session />
        </BrowserRouter>
      );

      fireEvent.change(screen.getByPlaceholderText(/Atomic Habits/i), {
        target: { value: 'Picker Session' },
      });
      fireEvent.click(screen.getByText('Video'));
      const submitBtn = await screen.findByRole('button', { name: /Generate Prompt #1/i });
      fireEvent.click(submitBtn);

      await waitFor(() =>
        expect(screen.getByText(/Copy Prompt #1/i)).toBeInTheDocument()
      );
      fireEvent.click(screen.getByRole('button', { name: /I Got My Improvements/i }));

      const jsonInput = await screen.findByPlaceholderText('{"improvements": [...]}');
      fireEvent.change(jsonInput, { target: { value: IMPORT_JSON } });
      fireEvent.click(screen.getByRole('button', { name: /Parse & Preview Improvements/i }));

      await waitFor(() => expect(screen.getByText(/Review & Confirm/i)).toBeInTheDocument());
    };

    beforeEach(async () => {
      await updateSettings({ defaultMode: 'prompt' });
    });

    it('starts with every improvement checked and a counted confirm button', async () => {
      await driveToStep4();

      const selectAll = screen.getByRole('checkbox', { name: /Select all improvements/i });
      expect(selectAll).toBeChecked();
      expect(screen.getByText(/Select all \(2 of 2 selected\)/i)).toBeInTheDocument();

      expect(screen.getByRole('checkbox', { name: /Select improvement 1/i })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: /Select improvement 2/i })).toBeChecked();

      const confirmButtons = screen.getAllByRole('button', { name: /Confirm Import \(2 selected\)/i });
      expect(confirmButtons.length).toBeGreaterThan(0);
      confirmButtons.forEach((btn) => expect(btn).toBeEnabled());
    });

    it('imports only the checked improvements on confirm', async () => {
      await driveToStep4();

      fireEvent.click(screen.getByRole('checkbox', { name: /Select improvement 2/i }));
      expect(screen.getByText(/Select all \(1 of 2 selected\)/i)).toBeInTheDocument();

      fireEvent.click(screen.getAllByRole('button', { name: /Confirm Import \(1 selected\)/i })[0]);

      await waitFor(async () => {
        const imported = await getImprovements();
        expect(imported).toHaveLength(1);
        expect(imported[0].construction).toBe('invite [someone] over');
      });
    });

    it('disables confirm at zero selection and re-enables after select-all', async () => {
      await driveToStep4();

      // Deselect everything via the select-all toggle.
      fireEvent.click(screen.getByRole('checkbox', { name: /Select all improvements/i }));
      expect(screen.getByText(/Select all \(0 of 2 selected\)/i)).toBeInTheDocument();

      screen
        .getAllByRole('button', { name: /Confirm Import \(0 selected\)/i })
        .forEach((btn) => expect(btn).toBeDisabled());

      // Re-select everything.
      fireEvent.click(screen.getByRole('checkbox', { name: /Select all improvements/i }));
      expect(screen.getByRole('checkbox', { name: /Select improvement 1/i })).toBeChecked();
      screen
        .getAllByRole('button', { name: /Confirm Import \(2 selected\)/i })
        .forEach((btn) => expect(btn).toBeEnabled());
    });
  });

  describe('Activity selector and Step-2 branching', () => {
    const STORY_PASSAGE = 'Вчера я пригласил друга в гости, и мы долго болтали.';
    const STORY_FEEDBACK = JSON.stringify({
      feedback: {
        summary: 'Nice work.',
        improved_version: 'Yesterday I invited a friend over and we talked for ages.',
        constructions: [
          {
            construction: 'invite [someone] over',
            original: 'invited a friend to my house',
            improved: 'invited a friend over',
            explanation: '"over" is the natural phrasing for casual visits.',
            category: 'collocation',
            spoken_frequency: 'very_high',
          },
        ],
      },
    });

    const fillStep1 = () => {
      fireEvent.change(screen.getByPlaceholderText(/Atomic Habits/i), {
        target: { value: 'Branching Session' },
      });
      fireEvent.click(screen.getByText('Video'));
    };

    const submitStep1 = async () => {
      const submitBtn = await screen.findByRole('button', {
        name: /(Generate Prompt #1|Start Seamless Voice Session)/i,
      });
      fireEvent.click(submitBtn);
    };

    beforeEach(() => {
      mocks.generateTranslationStoryPassage.mockReset();
      mocks.evaluateTranslationStory.mockReset();
      mocks.generateTranslationStoryPassage.mockResolvedValue(STORY_PASSAGE);
      mocks.evaluateTranslationStory.mockResolvedValue(STORY_FEEDBACK);
    });

    it('keeps the dialogue interface when the dialogue activity is selected', async () => {
      await updateSettings({ defaultMode: 'prompt' });
      render(
        <BrowserRouter>
          <Session />
        </BrowserRouter>
      );

      // Dialogue is the default selection.
      expect(document.querySelector('#activity-dialogue')).toHaveClass('border-purple-500');

      fillStep1();
      await submitStep1();

      expect(
        await screen.findByText(/Step 1: Describe Content/i)
      ).toBeInTheDocument();
      expect(screen.queryByText(/Writing your story/i)).not.toBeInTheDocument();

      const sessions = await getSessions();
      expect(sessions[0].activity).toBe('dialogue');
    });

    it('renders the story-translation interface and persists activity on the session', async () => {
      await updateSettings({ defaultMode: 'prompt' });
      render(
        <BrowserRouter>
          <Session />
        </BrowserRouter>
      );

      fireEvent.click(screen.getByText(/Story Translation/i));
      fillStep1();
      await submitStep1();

      // Passage prompt path does not render; the story round UI does.
      expect(screen.queryByText(/Step 1: Describe Content/i)).not.toBeInTheDocument();
      expect(await screen.findByText(/Вчера я пригласил друга в гости/)).toBeInTheDocument();
      expect(mocks.generateTranslationStoryPassage).toHaveBeenCalled();

      const sessions = await getSessions();
      expect(sessions[0].activity).toBe('translation');

      // Translate the story, finish, and land on the shared Step-4 picker.
      fireEvent.change(
        screen.getByPlaceholderText(/Type or speak your English translation/i),
        { target: { value: 'Yesterday I invited a friend to my house and we talked for ages.' } }
      );
      fireEvent.click(screen.getByRole('button', { name: /Translate ▶/i }));

      await screen.findByText(/Constructions from this round/i);
      fireEvent.click(screen.getByRole('button', { name: /Finish Story ✓/i }));

      await screen.findByText(/Review & Confirm/i);
      expect(screen.getByText(/invite \[someone\] over/)).toBeInTheDocument();

      // Only learner text lands in rawText; the AI passage stays out.
      const updated = (await getSessions())[0];
      expect(updated.activity).toBe('translation');
      expect(updated.rawText).toContain('invited a friend to my house');
      expect(updated.rawText).not.toContain(STORY_PASSAGE);
    });
  });
});

