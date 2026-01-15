import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { AskUserQuestionInput, AskUserQuestion } from "@/types/acp";
import {
  MessageCircleQuestion,
  Check,
  Send,
  Loader2,
} from "lucide-react";

interface AskUserQuestionCardProps {
  toolCallId: string;
  input: AskUserQuestionInput;
  onSubmit: (toolCallId: string, answers: Record<string, string | string[]>) => void;
  isSubmitting?: boolean;
  isAnswered?: boolean;
}

export function AskUserQuestionCard({
  toolCallId,
  input,
  onSubmit,
  isSubmitting = false,
  isAnswered = false,
}: AskUserQuestionCardProps) {
  // State: questionIndex -> selected option labels (array for multiSelect, single for single)
  const [selections, setSelections] = useState<Record<number, string[]>>(() => {
    // Initialize empty selections for each question
    const initial: Record<number, string[]> = {};
    input.questions.forEach((_, index) => {
      initial[index] = [];
    });
    return initial;
  });

  const handleOptionSelect = useCallback((questionIndex: number, optionLabel: string, multiSelect: boolean) => {
    setSelections(prev => {
      const current = prev[questionIndex] || [];
      if (multiSelect) {
        // Toggle selection for multiSelect
        if (current.includes(optionLabel)) {
          return { ...prev, [questionIndex]: current.filter(l => l !== optionLabel) };
        } else {
          return { ...prev, [questionIndex]: [...current, optionLabel] };
        }
      } else {
        // Single select - replace
        return { ...prev, [questionIndex]: [optionLabel] };
      }
    });
  }, []);

  const handleSubmit = useCallback(() => {
    // Build answers object: header -> selected label(s)
    const answers: Record<string, string | string[]> = {};
    input.questions.forEach((question, index) => {
      const selected = selections[index] || [];
      if (question.multiSelect) {
        answers[question.header] = selected;
      } else {
        answers[question.header] = selected[0] || "";
      }
    });
    onSubmit(toolCallId, answers);
  }, [toolCallId, input.questions, selections, onSubmit]);

  // Check if all required questions are answered
  const isComplete = input.questions.every((_, index) => {
    const selected = selections[index] || [];
    return selected.length > 0;
  });

  if (isAnswered) {
    return (
      <div className="border rounded-lg bg-green-500/10 border-green-500/30 overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2">
          <Check className="w-4 h-4 text-green-500" />
          <span className="flex-1 text-sm font-medium">Questions Answered</span>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg bg-blue-500/5 border-blue-500/30 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border-b border-blue-500/20">
        <MessageCircleQuestion className="w-4 h-4 text-blue-500" />
        <span className="flex-1 text-sm font-medium text-blue-600 dark:text-blue-400">
          Agent needs your input
        </span>
      </div>

      {/* Questions */}
      <div className="p-3 space-y-4">
        {input.questions.map((question, qIndex) => (
          <QuestionSection
            key={qIndex}
            question={question}
            selectedOptions={selections[qIndex] || []}
            onOptionSelect={(optionLabel) => handleOptionSelect(qIndex, optionLabel, question.multiSelect)}
            disabled={isSubmitting}
          />
        ))}

        {/* Submit button */}
        <div className="flex justify-end pt-2">
          <Button
            onClick={handleSubmit}
            disabled={!isComplete || isSubmitting}
            size="sm"
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Answers
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface QuestionSectionProps {
  question: AskUserQuestion;
  selectedOptions: string[];
  onOptionSelect: (optionLabel: string) => void;
  disabled?: boolean;
}

function QuestionSection({
  question,
  selectedOptions,
  onOptionSelect,
  disabled = false,
}: QuestionSectionProps) {
  return (
    <div className="space-y-2">
      {/* Question header and text */}
      <div>
        <span className="inline-block px-2 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded mb-1">
          {question.header}
        </span>
        <p className="text-sm font-medium">{question.question}</p>
        {question.multiSelect && (
          <p className="text-xs text-muted-foreground">Select all that apply</p>
        )}
      </div>

      {/* Options */}
      <div className="space-y-1.5">
        {question.options.map((option, oIndex) => {
          const isSelected = selectedOptions.includes(option.label);

          return (
            <button
              key={oIndex}
              onClick={() => !disabled && onOptionSelect(option.label)}
              disabled={disabled}
              className={cn(
                "w-full flex items-start gap-3 p-2.5 rounded-lg border text-left transition-all",
                "hover:bg-accent/50",
                isSelected
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-border bg-card",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {/* Checkbox/Radio indicator */}
              <div className="flex-shrink-0 mt-0.5">
                {question.multiSelect ? (
                  <Checkbox
                    checked={isSelected}
                    className="pointer-events-none"
                  />
                ) : (
                  <div
                    className={cn(
                      "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                      isSelected ? "border-blue-500" : "border-muted-foreground"
                    )}
                  >
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                    )}
                  </div>
                )}
              </div>

              {/* Option content */}
              <div className="flex-1 min-w-0">
                <div className={cn(
                  "text-sm font-medium",
                  isSelected && "text-blue-600 dark:text-blue-400"
                )}>
                  {option.label}
                </div>
                {option.description && (
                  <div className="text-xs text-muted-foreground mt-0.5 break-words">
                    {option.description}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
