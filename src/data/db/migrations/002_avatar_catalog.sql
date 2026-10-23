-- El catálogo de avatares creció de 7 a 29 ilustraciones (producto entregó
-- más imágenes). Redistribuye los avatares de los dummies ya sembrados para
-- que las zonas existentes también muestren la variedad nueva; se usa
-- avatar_seed para que la asignación sea determinista.

update media m
set path = 'dummies/avatars/hombre-' || ((u.avatar_seed % 12) + 1) || '.jpg'
from app_user u
where m.user_id = u.id
  and m.kind = 'avatar'
  and u.is_dummy
  and u.gender = 'hombre';

update media m
set path = 'dummies/avatars/mujer-' || ((u.avatar_seed % 17) + 1) || '.jpg'
from app_user u
where m.user_id = u.id
  and m.kind = 'avatar'
  and u.is_dummy
  and u.gender = 'mujer';

update media m
set path = case
  when u.avatar_seed % 29 < 12
    then 'dummies/avatars/hombre-' || ((u.avatar_seed % 29) + 1) || '.jpg'
  else 'dummies/avatars/mujer-' || ((u.avatar_seed % 29) - 11) || '.jpg'
end
from app_user u
where m.user_id = u.id
  and m.kind = 'avatar'
  and u.is_dummy
  and u.gender = 'no_binario';
