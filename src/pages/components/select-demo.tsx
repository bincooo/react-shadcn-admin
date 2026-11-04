import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const FRUITS = ['Apple', 'Banana', 'Blueberry', 'Grapes', 'Pineapple']
const VEGETABLES = ['Carrot', 'Broccoli', 'Spinach']

/** 分组 + 分隔线的下拉示例 */
export function SelectDemo() {
  const [valueState, setValue] = useState('Blueberry')
  return (
    <Select value={valueState} onValueChange={setValue}>
      <SelectTrigger className="w-64">
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Fruits</SelectLabel>
          {FRUITS.map((fruit) => (
            <SelectItem key={fruit} value={fruit}>
              {fruit}
            </SelectItem>
          ))}
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Vegetables</SelectLabel>
          {VEGETABLES.map((vegetable) => (
            <SelectItem key={vegetable} value={vegetable}>
              {vegetable}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
