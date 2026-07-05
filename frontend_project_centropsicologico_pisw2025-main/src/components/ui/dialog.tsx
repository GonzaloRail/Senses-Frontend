import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  const { open, onOpenChange } = props;
  const wasOpen = React.useRef(false);

  React.useEffect(() => {
    // When the dialog was open and now is closed, schedule a forced
    // cleanup of any leftover react-remove-scroll body styles after
    // the close animation has had a chance to run.
    if (wasOpen.current && !open) {
      const cleanup = () => {
        const body = document.body;
        body.removeAttribute("style");
        body.style.overflow = "";
        body.style.pointerEvents = "";
        body.style.paddingRight = "";
        body.style.position = "";
        body.style.touchAction = "";
        document
          .querySelectorAll("style[data-rss], style[data-remove-scroll]")
          .forEach((el) => el.remove());
        document
          .querySelectorAll("[data-radix-scroll-lock], [data-scroll-lock]")
          .forEach((el) => el.remove());
      };
      // Run a few times in case any cleanup runs after our first attempt
      setTimeout(cleanup, 250);
      setTimeout(cleanup, 350);
    }
    wasOpen.current = !!open;
  }, [open, onOpenChange]);

  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  )
}

function DialogBodyCleanup({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    return () => {
      // Force cleanup of react-remove-scroll styles on body.
      // react-remove-scroll attaches inline styles to <body> and inserts
      // a <style> tag with [data-rss] attribute to block scroll/wheel.
      // If Radix Dialog unmounts while these are still applied (e.g. via
      // conditional rendering {open && <Dialog>}), the body remains
      // "frozen" and pointer events stop working. We clean them up here
      // after a microtask so that react-remove-scroll's own cleanup
      // (if any) has already run.
      const cleanup = () => {
        const body = document.body;
        body.removeAttribute("style");
        body.style.overflow = "";
        body.style.pointerEvents = "";
        body.style.paddingRight = "";
        body.style.position = "";
        body.style.touchAction = "";
        document
          .querySelectorAll("style[data-rss], style[data-remove-scroll]")
          .forEach((el) => el.remove());
        document
          .querySelectorAll('[data-radix-scroll-lock], [data-scroll-lock]')
          .forEach((el) => el.remove());
      };
      cleanup();
      // Also run on the next tick in case something else re-applies them.
      setTimeout(cleanup, 0);
      setTimeout(cleanup, 50);
    };
  }, []);
  return <>{children}</>;
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
          className
        )}
        {...props}
      >
        <DialogBodyCleanup>
          {children}
          {showCloseButton && (
            <DialogPrimitive.Close
              data-slot="dialog-close"
              className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
            >
              <XIcon />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          )}
        </DialogBodyCleanup>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
