-- Producto pidió que todos los perfiles ya dados de alta vivan en la zona
-- metropolitana de Monterrey. Se reubican de forma determinista (con
-- avatar_seed) alrededor de 12 núcleos de la ZM, con un desplazamiento de
-- hasta ~2 km por perfil, y su area_label pasa a ser el núcleo asignado.

update app_user u
set lat = h.lat + ((coalesce(u.avatar_seed, 0) % 101) / 101.0 - 0.5) * 0.036,
    lng = h.lng + ((coalesce(u.avatar_seed, 0) % 89) / 89.0 - 0.5) * 0.040,
    area_label = h.label
from (values
  (0,  25.669, -100.309, 'Centro'),
  (1,  25.666, -100.304, 'Barrio Antiguo'),
  (2,  25.650, -100.402, 'San Pedro Garza García'),
  (3,  25.637, -100.313, 'Valle Oriente'),
  (4,  25.677, -100.256, 'Guadalupe'),
  (5,  25.742, -100.302, 'San Nicolás de los Garza'),
  (6,  25.781, -100.188, 'Apodaca'),
  (7,  25.796, -100.318, 'Escobedo'),
  (8,  25.673, -100.458, 'Santa Catarina'),
  (9,  25.717, -100.391, 'Cumbres'),
  (10, 25.693, -100.355, 'Mitras'),
  (11, 25.624, -100.271, 'Contry')
) as h(idx, lat, lng, label)
where u.is_dummy
  and coalesce(u.avatar_seed, 0) % 12 = h.idx;
