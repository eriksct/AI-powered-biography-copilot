/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAudioRecorder } from '../useAudioRecorder';

// Mock MediaRecorder
const mockMediaRecorder = {
  start: vi.fn(),
  stop: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  state: 'inactive' as string,
  ondataavailable: null as any,
  onstop: null as any,
};

const mockStream = {
  getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }]),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockMediaRecorder.state = 'inactive';
  mockMediaRecorder.ondataavailable = null;
  mockMediaRecorder.onstop = null;

  // Mock navigator.mediaDevices.getUserMedia
  Object.defineProperty(navigator, 'mediaDevices', {
    value: {
      getUserMedia: vi.fn().mockResolvedValue(mockStream),
    },
    writable: true,
    configurable: true,
  });

  // Mock MediaRecorder constructor
  (globalThis as any).MediaRecorder = vi.fn().mockImplementation(() => {
    mockMediaRecorder.state = 'recording';
    return mockMediaRecorder;
  });
  (globalThis as any).MediaRecorder.isTypeSupported = vi.fn().mockReturnValue(true);
});

describe('useAudioRecorder', () => {
  it('initializes with default state', () => {
    const { result } = renderHook(() => useAudioRecorder());

    expect(result.current.isRecording).toBe(false);
    expect(result.current.isPaused).toBe(false);
    expect(result.current.duration).toBe(0);
    expect(result.current.error).toBeNull();
  });

  it('starts recording and sets isRecording to true', async () => {
    const { result } = renderHook(() => useAudioRecorder());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100,
      },
    });
    expect(result.current.isRecording).toBe(true);
    expect(result.current.isPaused).toBe(false);
  });

  it('handles microphone permission denied error', async () => {
    (navigator.mediaDevices.getUserMedia as any).mockRejectedValueOnce(
      Object.assign(new Error('Permission denied'), { name: 'NotAllowedError' })
    );

    const { result } = renderHook(() => useAudioRecorder());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.isRecording).toBe(false);
    expect(result.current.error).toContain('microphone refusé');
  });

  it('handles generic microphone error', async () => {
    (navigator.mediaDevices.getUserMedia as any).mockRejectedValueOnce(
      new Error('Device not found')
    );

    const { result } = renderHook(() => useAudioRecorder());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.isRecording).toBe(false);
    expect(result.current.error).toContain('microphone');
  });

  it('stops recording and returns a blob', async () => {
    const { result } = renderHook(() => useAudioRecorder());

    await act(async () => {
      await result.current.startRecording();
    });

    // Simulate data available
    const mockBlob = new Blob(['audio-data'], { type: 'audio/webm' });
    act(() => {
      mockMediaRecorder.ondataavailable?.({ data: mockBlob } as any);
    });

    let blob: Blob | null = null;
    await act(async () => {
      const stopPromise = result.current.stopRecording();
      // Trigger onstop callback
      mockMediaRecorder.onstop?.();
      blob = await stopPromise;
    });

    expect(blob).toBeInstanceOf(Blob);
    expect(result.current.isRecording).toBe(false);
  });

  it('returns null when stopping inactive recorder', async () => {
    const { result } = renderHook(() => useAudioRecorder());

    let blob: Blob | null;
    await act(async () => {
      blob = await result.current.stopRecording();
    });

    expect(blob!).toBeNull();
  });

  it('pauses and resumes recording', async () => {
    const { result } = renderHook(() => useAudioRecorder());

    await act(async () => {
      await result.current.startRecording();
    });

    act(() => {
      result.current.pauseRecording();
    });
    expect(mockMediaRecorder.pause).toHaveBeenCalled();
    expect(result.current.isPaused).toBe(true);

    // Simulate state change for resume
    mockMediaRecorder.state = 'paused';
    act(() => {
      result.current.resumeRecording();
    });
    expect(mockMediaRecorder.resume).toHaveBeenCalled();
    expect(result.current.isPaused).toBe(false);
  });
});
