<template>
  <div class="intersection-observer" ref="intersect" >
    <div class="step">
      <slot>
        <h2>Step {{ step }}</h2>
      </slot>
    </div>
  </div>
</template>

<script>
export default {
  name: 'IntersectionObserver',
  props: {
    step: {
      type: Number,
      default: 0
    },
    observerOptions: {
      type: Object,
      default () {
        return {
          rootMargin: `-${0.5 * 100}% 0% -${100 - 0.5 * 100}% 0%`
        }
      }
    }
  },
  mounted () {
    // this.$emit('step', 'start')
    const { observerOptions, $refs, step } = this
    const observer = new IntersectionObserver(entries => {
      if (entries.filter(entry => entry.isIntersecting).length < 1) return
      this.$parent.$emit('step', step)
    }, observerOptions)

    observer.observe($refs.intersect)
  }
}
</script>

<style scoped lang="scss">

.intersection-observer {
  display: flex;
  flex-direction: column;
  align-self: flex-start;
  padding: 40vh 0 50vh;

  .step {
    pointer-events: all;
    hyphens: auto;
    max-width: 460px;
    padding: 20px;
    background: rgba($color: #ffffff, $alpha: 0.1);

    @supports ((-webkit-backdrop-filter: saturate(180%) blur(20px)) or(backdrop-filter: saturate(180%) blur(20px))) {
      -webkit-backdrop-filter: saturate(180%) blur(10px);
      backdrop-filter:saturate(180%) blur(10px)
    }
  }

  + .default {
    padding: 30vh 0 50vh;
  }
}
</style>
