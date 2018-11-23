const html = String.raw
const getIscaleUrl = (e, t, i, s) => {
  if (0) {
    return window.imgMinUrl
  }
  return `https://img-scale.now.sh?format=${t}&width=${
    (i = Math.floor(i)) > 50 ? i - (i % 50) : i - (i % 5)
  }&url=${encodeURIComponent(e)}&quality=${s}`
}
let invisibles = []

let active
const onScroll = () => {
  if (!active && invisibles.length > 0) {
    active = true
    setTimeout(() => {
      invisibles.forEach(e => e.checkVisibility())
      invisibles = invisibles.filter(e => !e.visible)
      active = false
    }, 200)
  }
}
const template = html`
  <picture>
    <source type="image/webp" />
    <source type="image/jpeg" />
    <img />
  </picture>
  <style>
    picture,
    img {
      display: block;
      width: 100%;
    }

    picture {
      overflow: hidden;
      padding-top: 66%;
      position: relative;
    }
    img {
      position: absolute;
      opacity: 0;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      filter: blur(15px);
      transform: scale(1.03);
      transition: all 0.3s linear;
    }
    :host {
      display: block;
      background: gray;
    }
  </style>
`
const getPaddingTop = e => {
  const [, t, i] = e.match(/([0-9]*\.?[0-9]*)\/([0-9]*\.?[0-9]*)/),
    s = parseFloat(t)
  return `${(100 * parseFloat(i)) / s}%`
}
let postponedHighres = []
const pendingPreviews = {}
customElements.define(
  'img-min',
  class extends HTMLElement {
    constructor() {
      super(),
        0 === invisibles.length &&
          document.addEventListener('scroll', onScroll),
        invisibles.push(this),
        (this.maxWidth = 0)
      const e = this.attachShadow({
        mode: 'open'
      })
      ;(e.innerHTML = template),
        (this.picture = e.querySelector('picture')),
        (this.jpeg = e.querySelector('source[type="image/jpeg"]')),
        (this.webp = e.querySelector('source[type="image/webp"]')),
        (this.img = this.shadowRoot.querySelector('img'))
      let t,
        i = 0
      ;(this.img.onload = e => {
        ++i
        console.log(getComputedStyle(this).borderColor)
        this.setAttribute('preview', '')
        console.log(getComputedStyle(this).borderColor)
        setTimeout(() => {}, 100)
        delete pendingPreviews[this.getAttribute('src')]
        this.img.style.opacity = '1'
        if (i === 2) {
          if (Date.now() - t < 300) {
          }
          this.img.style.filter = 'blur(0px)'
          this.img.style.transform = 'scale(1)'
          this.img.onload = null
        }
        if (i === 1) {
          t = Date.now()
          postponedHighres.push(() => this.resize())
        }

        0 === Object.keys(pendingPreviews).length &&
          (postponedHighres.reverse().forEach(e => e()),
          (postponedHighres = []))
      }),
        (this.resize = this.resize.bind(this)),
        addEventListener('resize', this.resize)
    }
    setSrc(e) {
      ;(this.jpeg.srcset = getIscaleUrl(
        this.getAttribute('src'),
        'jpeg',
        e,
        this.getAttribute('quality') || 50
      )),
        (this.webp.srcset = getIscaleUrl(
          this.getAttribute('src'),
          'webp',
          e,
          this.getAttribute('quality') || 50
        ))
    }
    disconnectedCallback() {
      removeEventListener('resize', this.resize)
    }
    checkVisibility() {
      const {
          top: e,
          bottom: t,
          width: i,
          height: s
        } = this.getBoundingClientRect(),
        r = t < -100,
        n = e > window.innerHeight + 100
      r ||
        n ||
        this.visible ||
        ((pendingPreviews[this.getAttribute('src')] = !0),
        this.setSrc(Math.max(10, i / 7)),
        (this.visible = !0))
    }
    resize() {
      this.visible &&
        (cancelAnimationFrame(this.af),
        (this.af = requestAnimationFrame(() => {
          let e
          const { width: t } = this.picture.getClientRects()[0]
          ;(e = parseInt(t)) <= this.maxWidth ||
            (this.setSrc(e), (this.maxWidth = e))
        })))
    }
    connectedCallback() {
      const e = this.getAttribute('aspect')
      e &&
        ((this.img.style.height = '100%'),
        (this.img.style.objectFit = 'cover'),
        (this.picture.style.paddingTop = getPaddingTop(e))),
        setTimeout(() => {
          this.checkVisibility()
        }, 100)
    }
  }
)
