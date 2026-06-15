import { useState, useCallback, useMemo } from 'react';

export interface ButtonConfig {
  id: string;
  label: string;
  value?: any;
  disabled?: boolean;
  data?: Record<string, any>;
}

export interface UseButtonGroupProps {
  defaultSelected?: string;
  allowDeselect?: boolean;
  onChange?: (selectedId: string | null, buttonConfig: ButtonConfig | null) => void;
}

export interface UseButtonGroupReturn {
  selectedId: string | null;
  buttons: ButtonConfig[];

  registerButton: (button: ButtonConfig) => void;
  unregisterButton: (id: string) => void;
  selectButton: (id: string) => void;
  clearSelection: () => void;

  selectedButton: ButtonConfig | null;
  selectedValue: any;

  isSelected: (id: string) => boolean;
  getButton: (id: string) => ButtonConfig | undefined;
  isDisabled: (id: string) => boolean;
}

export const useButtonGroup = (options: UseButtonGroupProps = {}): UseButtonGroupReturn => {
  const { defaultSelected, allowDeselect = false, onChange } = options;

  const [buttons, setButtons] = useState<ButtonConfig[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(defaultSelected || null);

  const registerButton = useCallback((button: ButtonConfig) => {
    setButtons(prev => {
      const exists = prev.find(b => b.id === button.id);
      if (exists) {
        return prev.map(b => b.id === button.id ? button : b);
      }
      return [...prev, button];
    });
  }, []);

  const unregisterButton = useCallback((id: string) => {
    setButtons(prev => prev.filter(b => b.id !== id));
    setSelectedId(prev => prev === id ? null : prev);
  }, []);

  const selectButton = useCallback((id: string) => {
    const button = buttons.find(b => b.id === id);
    if (!button || button.disabled) return;

    const newSelectedId = selectedId === id && allowDeselect ? null : id;
    const newSelectedButton = newSelectedId ? button : null;

    setSelectedId(newSelectedId);
    onChange?.(newSelectedId, newSelectedButton);
  }, [buttons, selectedId, allowDeselect, onChange]);

  const clearSelection = useCallback(() => {
    setSelectedId(null);
    onChange?.(null, null);
  }, [onChange]);

  const selectedButton = useMemo(() => {
    return selectedId ? buttons.find(b => b.id === selectedId) || null : null;
  }, [selectedId, buttons]);

  const selectedValue = useMemo(() => {
    return selectedButton?.value || selectedButton?.id || null;
  }, [selectedButton]);

  const isSelected = useCallback((id: string) => {
    return selectedId === id;
  }, [selectedId]);

  const getButton = useCallback((id: string) => {
    return buttons.find(b => b.id === id);
  }, [buttons]);

  const isDisabled = useCallback((id: string) => {
    const button = buttons.find(b => b.id === id);
    return button?.disabled || false;
  }, [buttons]);


  return {
    selectedId,
    buttons,

    registerButton,
    unregisterButton,
    selectButton,
    clearSelection,

    selectedButton,
    selectedValue,

    isSelected,
    getButton,
    isDisabled,
  };
};