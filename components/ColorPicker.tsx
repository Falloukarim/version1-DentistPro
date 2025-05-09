'use client';

import { HexColorPicker, HexColorInput } from 'react-colorful';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, Palette } from 'lucide-react';
import { useState } from 'react';
import { Label } from '@radix-ui/react-label';

export default function ColorPicker({
  value,
  onChange,
  label,
  className
}: {
  value: string;
  onChange: (color: string) => void;
  label: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [color, setColor] = useState(value);

  // Palettes de couleurs prédéfinies
  const colorPalettes = [
    ['#3b82f6', '#8b5cf6', '#10b981', '#ef4444'], // Bleu, Violet, Vert, Rouge
    ['#6366f1', '#ec4899', '#f59e0b', '#14b8a6'], // Indigo, Rose, Orange, Cyan
    ['#0ea5e9', '#84cc16', '#f97316', '#64748b']  // Sky, Lime, Orange, Slate
  ];

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    // Applique seulement quand on ferme le popover
  };

  const applyColor = () => {
    onChange(color);
    setOpen(false);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Label className="flex items-center gap-2">
        <Palette className="h-4 w-4" />
        {label}
      </Label>
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start gap-3 pl-3"
          >
            <div
              className="h-4 w-4 rounded-full border"
              style={{ backgroundColor: value }}
            />
            <span className="font-mono">{value.toUpperCase()}</span>
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-auto p-4 space-y-4">
          <HexColorPicker color={color} onChange={handleColorChange} />
          
          <div className="flex items-center gap-2">
            <HexColorInput
              color={color}
              onChange={handleColorChange}
              prefixed
              className="flex-1 border rounded px-2 py-1 text-sm font-mono"
            />
            <Button 
              size="sm" 
              onClick={applyColor}
              className="gap-1"
            >
              <Check className="h-3 w-3" />
              Appliquer
            </Button>
          </div>
          
          {/* Palettes de couleurs prédéfinies */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Palettes suggérées :</p>
            {colorPalettes.map((palette, i) => (
              <div key={i} className="flex gap-2">
                {palette.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className="h-6 w-6 rounded-full border hover:scale-110 transition-transform"
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                    aria-label={`Couleur ${c}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}