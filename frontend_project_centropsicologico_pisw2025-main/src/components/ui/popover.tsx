import * as React from "react";
import * as RadixPopover from "@radix-ui/react-popover";

export const Popover = RadixPopover.Root;
export const PopoverTrigger = RadixPopover.Trigger;
export const PopoverAnchor = RadixPopover.Anchor;

export const PopoverContent = React.forwardRef<
  React.ElementRef<typeof RadixPopover.Content>,
  React.ComponentPropsWithoutRef<typeof RadixPopover.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <RadixPopover.Content
    ref={ref}
    sideOffset={sideOffset}
    className={
      "z-50 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none animate-in fade-in-0 data-[state=open]:slide-in-from-top-2 w-72 " +
      (className || "")
    }
    {...props}
  />
));

PopoverContent.displayName = RadixPopover.Content.displayName;
