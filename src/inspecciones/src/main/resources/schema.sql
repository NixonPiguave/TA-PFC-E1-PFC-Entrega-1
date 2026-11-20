create table if not exists claves (
    clave varchar(128) primary key,
    turno_id bigint not null check (turno_id > 0),
    unique (clave, turno_id)
);

create table if not exists inspecciones (
    id uuid primary key,
    turno_id bigint not null unique,
    autorizacion_id uuid not null unique,
    clave varchar(128) not null unique,
    foreign key (clave, turno_id) references claves(clave, turno_id)
);
