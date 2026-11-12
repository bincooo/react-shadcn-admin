import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { cn } from "cn";
import { CheckIcon, MinusIcon } from "lucide-react";

function Checkbox({ className, indeterminate, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      indeterminate={indeterminate}
      className={cn(
        "peer relative flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-[4px] border border-input bg-card transition-colors outline-none hover:border-primary focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30 data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground data-indeterminate:border-primary data-indeterminate:bg-primary/15 data-indeterminate:text-primary",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none [&>svg]:size-3"
      >
        {indeterminate ? (
          <MinusIcon className="stroke-[3]" />
        ) : (
          <CheckIcon className="stroke-[3]" />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
