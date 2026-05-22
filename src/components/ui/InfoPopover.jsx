// src/components/ui/InfoPopover.jsx
// Кнопка-вопрос, открывающая центрированную модалку с подсказкой/гайдом
// (тот же визуальный блок, что и «Как работать?»).
import { useState } from 'react'
import { HelpCircle } from 'lucide-react'
import IconButton from './IconButton.jsx'
import Modal from './Modal.jsx'

export default function InfoPopover({ title, children, ariaLabel = 'Помощь' }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <IconButton
        variant="soft"
        size="sm"
        icon={HelpCircle}
        ariaLabel={ariaLabel}
        onClick={() => setOpen(true)}
      />
      <Modal open={open} onClose={() => setOpen(false)} title={title}>
        {children}
      </Modal>
    </>
  )
}
