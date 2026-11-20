create table if not exists claves (
    clave varchar(128) primary key,
    turno_id bigint not null check (turno_id > 0),
    unique (clave, turno_id)
);

create table if not exists turnos (
    id bigint primary key check (id > 0),
    habilitado boolean not null
);

create table if not exists pagos (
    turno_id bigint primary key references turnos(id),
    confirmado boolean not null
);

create table if not exists autorizaciones (
    id uuid primary key,
    turno_id bigint not null unique references turnos(id),
    clave varchar(128) not null unique,
    foreign key (clave, turno_id) references claves(clave, turno_id)
);
