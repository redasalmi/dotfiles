# functions
function lighthouse-mobile() {
  lighthouse $1 --view
}

function lighthouse-desktop() {
  lighthouse $1 --view --preset="desktop"
}
