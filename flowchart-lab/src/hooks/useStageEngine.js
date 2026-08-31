import { useState, useEffect, useRef, useCallback } from 'react';
import { TIMER_STATES, getStageConfig, getContextualFeedback } from '../engine/gameEngine.js';
import { recordActivityAttempt, logEvent, updateStudentProgress } from '../services/supabaseService.js';

export function useStageEngine({
  stageId,
  studentId,
  lessonId = 'ch1',
  onStageComplete = () => {}
}) {
  const config = getStageConfig(stageId);
  const timeLimit = config.timeLimit || 180;

  // Timer State
  const [timerState, setTimerState] = useState(TIMER_STATES.NOT_STARTED);
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Statistics
  const [attemptCount, setAttemptCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);

  // Double-Click Lock
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modals
  const [feedbackState, setFeedbackState] = useState({
    isOpen: false,
    isCorrect: false,
    title: '',
    message: '',
    attemptNumber: 1,
    canContinue: true
  });

  const [resultState, setResultState] = useState({
    isOpen: false,
    stageTitle: config.title,
    stageNumber: config.stageNumber,
    elapsedSeconds: 0,
    attemptCount: 0,
    correctCount: 0,
    status: 'completed'
  });

  // End-time and start-time refs for timestamp accuracy
  const endTimeRef = useRef(null);
  const startTimeRef = useRef(null);
  const pausedRemainingRef = useRef(timeLimit);
  const timerIntervalRef = useRef(null);
  const stageCompleteCalledRef = useRef(false);

  // 1. Start Stage Timer
  const startStage = useCallback(() => {
    startTimeRef.current = Date.now();
    endTimeRef.current = Date.now() + timeLimit * 1000;
    pausedRemainingRef.current = timeLimit;
    setTimerState(TIMER_STATES.RUNNING);
    setTimeRemaining(timeLimit);
    stageCompleteCalledRef.current = false;

    // Log telemetry
    if (studentId) {
      logEvent(studentId, 'stage_started', `เริ่มด่าน: ${config.title}`, {
        stage_id: stageId,
        time_limit: timeLimit
      });
    }
  }, [stageId, studentId, timeLimit, config.title]);

  // 2. Pause / Resume
  const pauseStage = useCallback(() => {
    if (timerState !== TIMER_STATES.RUNNING) return;
    const now = Date.now();
    const remaining = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000));
    pausedRemainingRef.current = remaining;
    setTimerState(TIMER_STATES.PAUSED);
  }, [timerState]);

  const resumeStage = useCallback(() => {
    if (timerState !== TIMER_STATES.PAUSED) return;
    endTimeRef.current = Date.now() + pausedRemainingRef.current * 1000;
    setTimerState(TIMER_STATES.RUNNING);
  }, [timerState]);

  // 3. Time Up Handler
  const handleTimeUp = useCallback(async () => {
    setTimerState(TIMER_STATES.TIME_UP);
    setTimeRemaining(0);
    const totalElapsed = startTimeRef.current
      ? Math.round((Date.now() - startTimeRef.current) / 1000)
      : timeLimit;
    setElapsedSeconds(totalElapsed);

    if (studentId) {
      logEvent(studentId, 'stage_time_up', `⏰ หมดเวลาด่าน: ${config.title}`, {
        stage_id: stageId,
        elapsed_seconds: totalElapsed
      });
      // Progress remains intact and updates
      await updateStudentProgress({
        studentId,
        lessonId,
        currentStage: stageId,
        status: 'in_progress'
      });
    }

    setResultState({
      isOpen: true,
      stageTitle: config.title,
      stageNumber: config.stageNumber,
      elapsedSeconds: totalElapsed,
      attemptCount,
      correctCount,
      status: 'time_up'
    });
  }, [stageId, studentId, lessonId, timeLimit, config, attemptCount, correctCount]);

  // 4. Timer Clock Ticker (Timestamp based, accurate against browser throttling)
  useEffect(() => {
    if (timerState !== TIMER_STATES.RUNNING) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000));
      setTimeRemaining(remaining);

      if (startTimeRef.current) {
        setElapsedSeconds(Math.round((now - startTimeRef.current) / 1000));
      }

      if (remaining <= 0) {
        clearInterval(timerIntervalRef.current);
        handleTimeUp();
      }
    }, 250);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timerState, handleTimeUp]);

  // 5. Record Activity Attempt (with Double Click Protection & Positive Feedback)
  const submitActivity = useCallback(async ({
    activityId,
    isCorrect,
    answer = null,
    conceptKey = 'default',
    customExplanation = '',
    onFeedbackContinue = null
  }) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const nextAttemptNum = attemptCount + 1;
    setAttemptCount(nextAttemptNum);

    if (isCorrect) {
      setCorrectCount(c => c + 1);
    } else {
      setWrongCount(w => w + 1);
    }

    const currentElapsed = startTimeRef.current
      ? Math.round((Date.now() - startTimeRef.current) / 1000)
      : 0;

    // Send attempt to Supabase
    if (studentId) {
      await recordActivityAttempt({
        studentId,
        activityId,
        stageId,
        answer,
        isCorrect,
        attemptNumber: nextAttemptNum,
        elapsedSeconds: currentElapsed
      });
    }

    // Get non-punitive feedback
    const feedback = getContextualFeedback(conceptKey, isCorrect, customExplanation);

    setFeedbackState({
      isOpen: true,
      isCorrect,
      title: feedback.title,
      message: feedback.message,
      attemptNumber: nextAttemptNum,
      canContinue: true,
      onContinue: onFeedbackContinue
    });

    setIsSubmitting(false);
  }, [isSubmitting, attemptCount, studentId, stageId]);

  // 6. Close Feedback
  const closeFeedback = useCallback(() => {
    const nextAction = feedbackState.onContinue;
    setFeedbackState(prev => ({ ...prev, isOpen: false }));
    if (typeof nextAction === 'function') {
      nextAction();
    }
  }, [feedbackState]);

  // 7. Complete Stage (No score rankings, pure milestone completion)
  const completeStage = useCallback(async () => {
    if (stageCompleteCalledRef.current) return;
    stageCompleteCalledRef.current = true;

    setTimerState(TIMER_STATES.COMPLETED);
    const finalElapsed = startTimeRef.current
      ? Math.round((Date.now() - startTimeRef.current) / 1000)
      : elapsedSeconds;

    if (studentId) {
      await logEvent(studentId, 'stage_completed', `🎯 สำเร็จด่าน: ${config.title}`, {
        stage_id: stageId,
        elapsed_seconds: finalElapsed,
        attempts: attemptCount,
        correct_count: correctCount
      });

      await updateStudentProgress({
        studentId,
        lessonId,
        currentStage: stageId,
        status: config.stageNumber === 8 ? 'completed' : 'in_progress'
      });
    }

    setResultState({
      isOpen: true,
      stageTitle: config.title,
      stageNumber: config.stageNumber,
      elapsedSeconds: finalElapsed,
      attemptCount,
      correctCount,
      status: 'completed'
    });
  }, [stageId, studentId, lessonId, elapsedSeconds, attemptCount, correctCount, config]);

  // 8. Proceed to Next Stage
  const proceedNextStage = useCallback(() => {
    setResultState(prev => ({ ...prev, isOpen: false }));
    onStageComplete();
  }, [onStageComplete]);

  return {
    config,
    timerState,
    timeRemaining,
    elapsedSeconds,
    attemptCount,
    correctCount,
    wrongCount,
    isSubmitting,
    feedbackState,
    resultState,
    startStage,
    pauseStage,
    resumeStage,
    submitActivity,
    closeFeedback,
    completeStage,
    proceedNextStage
  };
}
