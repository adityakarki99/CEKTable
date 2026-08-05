import * as RadixCheckbox from '@radix-ui/react-checkbox'

export type CheckboxProps = (
  | { checked: boolean | 'indeterminate'; onCheckedChange: (checked: boolean) => void; defaultChecked?: never }
  | { checked?: never; onCheckedChange?: never; defaultChecked?: boolean }
) & {
  'aria-label'?: string
  className?: string
}

export function Checkbox({ checked, onCheckedChange, defaultChecked, className = '', ...rest }: CheckboxProps) {
  return (
    <RadixCheckbox.Root
      checked={checked}
      defaultChecked={defaultChecked}
      onCheckedChange={onCheckedChange ? (value) => onCheckedChange(value === true) : undefined}
      className={`row-checkbox ${className}`}
      {...rest}
    >
      <RadixCheckbox.Indicator className="row-checkbox-indicator">
        {checked === 'indeterminate' ? (
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M1 4h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M1 4l2 2 4-4.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </RadixCheckbox.Indicator>
    </RadixCheckbox.Root>
  )
}

export default Checkbox
