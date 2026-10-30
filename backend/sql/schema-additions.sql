-- Дополнения схемы service_tech после доработок.
-- Существующие таблицы и данные не пересоздаются.
-- На сервере TypeORM (synchronize) уже применил эти изменения при запуске.

-- Привязка заказчиков к сотрудникам сервисной службы.
-- Сотрудник видит заявки только перечисленных здесь заказчиков.
CREATE TABLE IF NOT EXISTS public.staff_clients (
    staff_id integer NOT NULL,
    client_id integer NOT NULL,
    CONSTRAINT "PK_43da87e1a95865eac2c5d58f8fe" PRIMARY KEY (staff_id, client_id),
    CONSTRAINT "FK_801481463d016d45120fce1c586"
        FOREIGN KEY (staff_id) REFERENCES public.staffs(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT "FK_8e98f9fb877ad12f3f85cd2836f"
        FOREIGN KEY (client_id) REFERENCES public.clients(id)
);

CREATE INDEX IF NOT EXISTS "IDX_801481463d016d45120fce1c58"
    ON public.staff_clients (staff_id);

CREATE INDEX IF NOT EXISTS "IDX_8e98f9fb877ad12f3f85cd2836"
    ON public.staff_clients (client_id);

-- Идентификатор пользователя ВКонтакте для уведомлений.
ALTER TABLE public.admins
    ADD COLUMN IF NOT EXISTS vk_id character varying(200);

ALTER TABLE public.staffs
    ADD COLUMN IF NOT EXISTS vk_id character varying(200);

ALTER TABLE public.clients
    ADD COLUMN IF NOT EXISTS vk_id character varying(200);
