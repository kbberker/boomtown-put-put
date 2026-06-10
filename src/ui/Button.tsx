import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router'
import styles from './Button.module.css'

type Variant = 'cta' | 'ghost-dark' | 'ghost-light'

const variantClass: Record<Variant, string> = {
  cta: styles.cta,
  'ghost-dark': styles.ghostDark,
  'ghost-light': styles.ghostLight,
}

function classes(variant: Variant, big: boolean): string {
  return [styles.button, variantClass[variant], big ? styles.big : '', 'bt-press']
    .filter(Boolean)
    .join(' ')
}

/**
 * Chunky arcade button: solid yellow CTA with the hard drop shadow, or a
 * ghost variant for secondary actions (dark for felt, light for cream).
 */
export function Button({
  variant = 'cta',
  big = false,
  type = 'button',
  children,
  ...rest
}: {
  variant?: Variant
  big?: boolean
  children: ReactNode
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'>) {
  return (
    <button type={type} className={classes(variant, big)} {...rest}>
      {children}
    </button>
  )
}

/** The same chunky look on a react-router link, for pure-navigation CTAs. */
export function ButtonLink({
  to,
  variant = 'cta',
  big = false,
  children,
}: {
  to: string
  variant?: Variant
  big?: boolean
  children: ReactNode
}) {
  return (
    <Link to={to} className={classes(variant, big)}>
      {children}
    </Link>
  )
}
