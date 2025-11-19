export default defineAppConfig({
  ui: {
    colors: {
      primary: 'green',
      neutral: 'slate'
    },
    input: {
      defaultVariants: {
        size: 'lg'
      }
    },
    button: {
      slots: {
        base: [
          'rounded-md font-medium inline-flex items-center disabled:cursor-not-allowed aria-disabled:cursor-not-allowed disabled:opacity-75 aria-disabled:opacity-75',
          'transition-colors cursor-pointer'
        ]
      }
    }
  }
})
