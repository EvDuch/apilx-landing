let SessionLoad = 1
let s:so_save = &g:so | let s:siso_save = &g:siso | setg so=0 siso=0 | setl so=-1 siso=-1
let v:this_session=expand("<sfile>:p")
silent only
silent tabonly
cd ~/Local\ Sites/cost-calc/app/public/wp-content/plugins/cost-calculator-free-v3
if expand('%') == '' && !&modified && line('$') <= 1 && getline(1) == ''
  let s:wipebuf = bufnr('%')
endif
let s:shortmess_save = &shortmess
if &shortmess =~ 'A'
  set shortmess=aoOA
else
  set shortmess=aoO
endif
badd +242 frontend/src/admin/components/basic/calculator/fields/formula/formula-field.js
badd +379 templates/frontend/render.php
badd +5 templates/admin/single-calc/fields/date-picker-field.php
badd +322 frontend/assets/scss/components/frontend/fields/custom-date-calendar.scss
badd +641 frontend/src/frontend/components/fields/cost-date-picker/cost-custom-date-calendar.js
badd +586 frontend/assets/scss/components/admin/fields/date-picker.scss
badd +468 ~/.config/nvim/lua/plugins/lazy.lua
badd +15 ~/.config/nvim/lua/plugins/harpoon.lua
badd +0 ~/Local\ Sites/cost-calc/app/public/wp-content/plugins/cost-calculator-free-v3
argglobal
%argdel
$argadd ~/Local\ Sites/cost-calc/app/public/wp-content/plugins/cost-calculator-free-v3
edit frontend/src/frontend/components/fields/cost-date-picker/cost-custom-date-calendar.js
wincmd t
let s:save_winminheight = &winminheight
let s:save_winminwidth = &winminwidth
set winminheight=0
set winheight=1
set winminwidth=0
set winwidth=1
argglobal
balt frontend/src/admin/components/basic/calculator/fields/formula/formula-field.js
setlocal fdm=expr
setlocal fde=nvim_treesitter#foldexpr()
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal nofen
let s:l = 641 - ((10 * winheight(0) + 24) / 48)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 641
normal! 0
lcd ~/Local\ Sites/cost-calc/app/public/wp-content/plugins/cost-calculator-free-v3
tabnext 1
if exists('s:wipebuf') && len(win_findbuf(s:wipebuf)) == 0 && getbufvar(s:wipebuf, '&buftype') isnot# 'terminal'
  silent exe 'bwipe ' . s:wipebuf
endif
unlet! s:wipebuf
set winheight=1 winwidth=20
let &shortmess = s:shortmess_save
let &winminheight = s:save_winminheight
let &winminwidth = s:save_winminwidth
let s:sx = expand("<sfile>:p:r")."x.vim"
if filereadable(s:sx)
  exe "source " . fnameescape(s:sx)
endif
let &g:so = s:so_save | let &g:siso = s:siso_save
set hlsearch
let g:this_session = v:this_session
let g:this_obsession = v:this_session
doautoall SessionLoadPost
unlet SessionLoad
" vim: set ft=vim :
