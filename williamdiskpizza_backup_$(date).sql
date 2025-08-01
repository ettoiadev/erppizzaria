--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

-- Started on 2025-06-27 13:21:54

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 6 (class 2615 OID 16578)
-- Name: auth; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA auth;


ALTER SCHEMA auth OWNER TO postgres;

--
-- TOC entry 877 (class 1247 OID 16646)
-- Name: order_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.order_status AS ENUM (
    'RECEIVED',
    'PREPARING',
    'ON_THE_WAY',
    'DELIVERED',
    'CANCELLED'
);


ALTER TYPE public.order_status OWNER TO postgres;

--
-- TOC entry 883 (class 1247 OID 16668)
-- Name: payment_method; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.payment_method AS ENUM (
    'CASH',
    'CREDIT_CARD',
    'DEBIT_CARD',
    'PIX'
);


ALTER TYPE public.payment_method OWNER TO postgres;

--
-- TOC entry 880 (class 1247 OID 16658)
-- Name: payment_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.payment_status AS ENUM (
    'PENDING',
    'PAID',
    'FAILED',
    'REFUNDED'
);


ALTER TYPE public.payment_status OWNER TO postgres;

--
-- TOC entry 865 (class 1247 OID 16590)
-- Name: user_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role AS ENUM (
    'customer',
    'admin',
    'kitchen',
    'delivery'
);


ALTER TYPE public.user_role OWNER TO postgres;

--
-- TOC entry 232 (class 1255 OID 16816)
-- Name: assign_product_number(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.assign_product_number() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.product_number IS NULL THEN
        NEW.product_number := nextval('products_number_seq');
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.assign_product_number() OWNER TO postgres;

--
-- TOC entry 233 (class 1255 OID 16853)
-- Name: update_drivers_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_drivers_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_drivers_updated_at() OWNER TO postgres;

--
-- TOC entry 231 (class 1255 OID 16805)
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 218 (class 1259 OID 16579)
-- Name: users; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE auth.users OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 16762)
-- Name: about_content; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.about_content (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    section character varying(50) NOT NULL,
    title character varying(255),
    content text NOT NULL,
    image_url text,
    order_position integer DEFAULT 0,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.about_content OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 16776)
-- Name: admin_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    setting_key character varying(100) NOT NULL,
    setting_value text,
    setting_type character varying(20) DEFAULT 'string'::character varying,
    description text,
    updated_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.admin_settings OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16618)
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    sort_order integer DEFAULT 0,
    image character varying(255)
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 16751)
-- Name: contact_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contact_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(20),
    subject character varying(255),
    message text NOT NULL,
    status character varying(20) DEFAULT 'PENDING'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.contact_messages OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16735)
-- Name: customer_addresses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customer_addresses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    label character varying(50) NOT NULL,
    street character varying(255) NOT NULL,
    number character varying(20) NOT NULL,
    complement character varying(100),
    neighborhood character varying(100) NOT NULL,
    city character varying(100) NOT NULL,
    state character varying(2) NOT NULL,
    zip_code character varying(10) NOT NULL,
    is_default boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.customer_addresses OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 16821)
-- Name: drivers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.drivers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid,
    name character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(20) NOT NULL,
    vehicle_type character varying(20) NOT NULL,
    vehicle_plate character varying(10),
    status character varying(20) DEFAULT 'offline'::character varying NOT NULL,
    current_location text,
    total_deliveries integer DEFAULT 0,
    average_rating numeric(2,1) DEFAULT 0.0,
    average_delivery_time integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    last_active_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    active boolean DEFAULT true,
    deleted_at timestamp without time zone,
    CONSTRAINT drivers_status_check CHECK (((status)::text = ANY ((ARRAY['available'::character varying, 'busy'::character varying, 'offline'::character varying])::text[]))),
    CONSTRAINT drivers_vehicle_type_check CHECK (((vehicle_type)::text = ANY ((ARRAY['motorcycle'::character varying, 'bicycle'::character varying, 'car'::character varying])::text[])))
);


ALTER TABLE public.drivers OWNER TO postgres;

--
-- TOC entry 4997 (class 0 OID 0)
-- Dependencies: 230
-- Name: COLUMN drivers.active; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.drivers.active IS 'Indica se o entregador está ativo';


--
-- TOC entry 4998 (class 0 OID 0)
-- Dependencies: 230
-- Name: COLUMN drivers.deleted_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.drivers.deleted_at IS 'Data da exclusão lógica';


--
-- TOC entry 223 (class 1259 OID 16696)
-- Name: order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid,
    product_id uuid,
    quantity integer NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    total_price numeric(10,2) NOT NULL,
    size character varying(50),
    toppings jsonb DEFAULT '[]'::jsonb,
    special_instructions text,
    created_at timestamp with time zone DEFAULT now(),
    half_and_half jsonb,
    name character varying(255)
);


ALTER TABLE public.order_items OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 16716)
-- Name: order_status_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_status_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid,
    old_status character varying(20),
    new_status character varying(20) NOT NULL,
    changed_by uuid,
    changed_at timestamp with time zone DEFAULT now(),
    notes text
);


ALTER TABLE public.order_status_history OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16677)
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    status public.order_status DEFAULT 'RECEIVED'::public.order_status,
    total numeric(10,2) NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    delivery_fee numeric(10,2) DEFAULT 0,
    discount numeric(10,2) DEFAULT 0,
    payment_method public.payment_method NOT NULL,
    payment_status public.payment_status DEFAULT 'PENDING'::public.payment_status,
    delivery_address text NOT NULL,
    delivery_phone character varying(20) DEFAULT ''::character varying,
    delivery_instructions text,
    estimated_delivery_time timestamp with time zone,
    delivered_at timestamp with time zone,
    cancelled_at timestamp with time zone,
    cancellation_reason text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    driver_id uuid,
    customer_name character varying(255)
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16629)
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    category_id uuid,
    image text,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    available boolean DEFAULT true,
    sizes jsonb DEFAULT '[]'::jsonb,
    toppings jsonb DEFAULT '[]'::jsonb,
    show_image boolean DEFAULT true,
    product_number integer
);


ALTER TABLE public.products OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 16815)
-- Name: products_number_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.products_number_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.products_number_seq OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16599)
-- Name: profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email character varying(255) NOT NULL,
    full_name character varying(255) NOT NULL,
    phone character varying(20),
    role public.user_role DEFAULT 'customer'::public.user_role,
    password_hash character varying(255) NOT NULL,
    email_verified boolean DEFAULT false,
    profile_completed boolean DEFAULT false,
    last_login timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.profiles OWNER TO postgres;

--
-- TOC entry 4979 (class 0 OID 16579)
-- Dependencies: 218
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.users (id, email, created_at, updated_at) FROM stdin;
00000000-0000-0000-0000-000000000001	admin@williamdiskpizza.com	2025-06-19 14:19:05.089059-03	2025-06-19 14:19:05.089059-03
8e66e83e-a62b-47f9-98fb-8e84707fb916	ettobr@gmail.com	2025-06-19 15:11:10.947744-03	2025-06-19 15:11:10.947744-03
02304b73-09db-4ff6-9c23-f02ae642b102	ettomkt@gmail.com	2025-06-19 15:43:35.162175-03	2025-06-19 15:43:35.162175-03
8ab82e95-c2c9-4671-a0d6-8a6fca88a862	ettopropaganda@gmail.com	2025-06-20 18:56:58.686373-03	2025-06-20 18:56:58.686373-03
a2dba518-c861-47a4-a2b6-58f1fbff9b29	joicephf@gmail.com	2025-06-24 22:34:05.665059-03	2025-06-24 22:34:05.665059-03
\.


--
-- TOC entry 4988 (class 0 OID 16762)
-- Dependencies: 227
-- Data for Name: about_content; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.about_content (id, section, title, content, image_url, order_position, active, created_at, updated_at) FROM stdin;
3b74b9be-77ed-4381-8a14-35c717bea9aa	hero	Bem-vindos à William Disk Pizza	A melhor pizza da cidade, feita com ingredientes frescos e muito amor!	\N	1	t	2025-06-19 14:19:05.089059-03	2025-06-19 14:19:05.089059-03
f7803571-4b46-4822-b5a0-724c99ccc399	story	Nossa História	Fundada em 2020, a William Disk Pizza nasceu do sonho de oferecer pizzas autênticas e saborosas para toda a família.	\N	2	t	2025-06-19 14:19:05.089059-03	2025-06-19 14:19:05.089059-03
7b48d257-5bff-46bf-9a1f-0f1ba649b83c	mission	Nossa Missão	Proporcionar momentos únicos através de pizzas artesanais feitas com ingredientes selecionados e o melhor atendimento.	\N	3	t	2025-06-19 14:19:05.089059-03	2025-06-19 14:19:05.089059-03
\.


--
-- TOC entry 4989 (class 0 OID 16776)
-- Dependencies: 228
-- Data for Name: admin_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin_settings (id, setting_key, setting_value, setting_type, description, updated_by, created_at, updated_at) FROM stdin;
e2f9dd4e-67ef-4c1a-b2db-714b908a00b6	teamSubtitle	As pessoas que fazem a magia acontecer	string	\N	02304b73-09db-4ff6-9c23-f02ae642b102	2025-06-19 16:29:34.467425-03	2025-06-27 12:57:39.874118-03
7da9ebd0-18b6-4646-aaaa-78b90a7a505a	fastDeliveryEnabled	true	string	\N	02304b73-09db-4ff6-9c23-f02ae642b102	2025-06-19 16:01:48.604535-03	2025-06-27 12:57:39.844996-03
b43474d2-3cfc-428b-8e84-9ebdfe98d2c2	teamTitle	Nossa Equipe	string	\N	02304b73-09db-4ff6-9c23-f02ae642b102	2025-06-19 16:29:34.463912-03	2025-06-27 12:57:39.875064-03
957ead40-8345-4882-8442-46d3908e2b43	fastDeliverySubtext	Entrega expressa em até 30 minutos ou sua pizza é grátis	string	\N	02304b73-09db-4ff6-9c23-f02ae642b102	2025-06-19 16:01:48.613269-03	2025-06-27 12:57:39.846308-03
7caae713-cc29-40ba-a6d4-fb537616ccbb	theme	light	string	\N	02304b73-09db-4ff6-9c23-f02ae642b102	2025-06-19 16:29:34.417928-03	2025-06-27 12:57:39.876079-03
ad0a4cb0-4d1b-4eb7-a113-3e858da247d4	fastDeliveryTitle	Super Rápido	string	\N	02304b73-09db-4ff6-9c23-f02ae642b102	2025-06-19 16:01:48.60976-03	2025-06-27 12:57:39.847245-03
ca7906a0-c9c4-4809-b4cc-54a227f58a99	fontFamily	Inter	string	\N	02304b73-09db-4ff6-9c23-f02ae642b102	2025-06-19 16:29:34.420578-03	2025-06-27 12:57:39.848219-03
6c04149e-f8a1-4f2e-989b-32b82b750a77	valuesSubtitle	Os princípios que nos guiam todos os dias	string	\N	02304b73-09db-4ff6-9c23-f02ae642b102	2025-06-19 16:29:34.457785-03	2025-06-27 12:57:39.877211-03
0e73086d-7257-4956-95b7-e3161b6dff3c	valuesTitle	Nossos Valores	string	\N	02304b73-09db-4ff6-9c23-f02ae642b102	2025-06-19 16:29:34.455017-03	2025-06-27 12:57:39.87817-03
7c9ce685-276c-4bd7-9483-7ea942d911d1	website	www.williamdiskpizza.com	string	\N	02304b73-09db-4ff6-9c23-f02ae642b102	2025-06-19 16:01:48.574094-03	2025-06-27 12:57:39.879088-03
dddc7223-f2b7-4ddb-889c-69d25cf4d2ac	fontSize	medium	string	\N	02304b73-09db-4ff6-9c23-f02ae642b102	2025-06-19 16:29:34.423511-03	2025-06-27 12:57:39.8498-03
ce0a8826-72be-4a4e-a6f8-033e3960ec0e	freeDeliveryEnabled	true	string	\N	02304b73-09db-4ff6-9c23-f02ae642b102	2025-06-19 16:01:48.616233-03	2025-06-27 12:57:39.851772-03
0fa1c24d-f5a8-4874-b272-1ae65d84f58d	freeDeliverySubtext	Entrega gratuita para pedidos acima de R$ 50,00	string	\N	02304b73-09db-4ff6-9c23-f02ae642b102	2025-06-19 16:01:48.621762-03	2025-06-27 12:57:39.85411-03
9e764486-3afe-49e8-9d0f-d0b56721239d	freeDeliveryTitle	Frete Grátis	string	\N	02304b73-09db-4ff6-9c23-f02ae642b102	2025-06-19 16:01:48.619117-03	2025-06-27 12:57:39.855377-03
8189f13a-a1c8-42af-a826-77dd30cf07e7	isOpen	true	string	\N	02304b73-09db-4ff6-9c23-f02ae642b102	2025-06-19 16:01:48.585642-03	2025-06-27 12:57:39.857332-03
ea89027a-2362-49ec-994e-f3981e7b6f7c	min_order_value	20	decimal	Valor mínimo do pedido	02304b73-09db-4ff6-9c23-f02ae642b102	2025-06-19 14:19:05.089059-03	2025-06-27 12:57:39.860794-03
d939dd71-6306-410c-a320-8c821138b09c	openingHours	18:00	string	\N	02304b73-09db-4ff6-9c23-f02ae642b102	2025-06-19 16:01:48.579158-03	2025-06-27 12:57:39.861751-03
43ff4132-3864-4774-abbd-562a159ef686	primaryColor	#ef4444	string	\N	02304b73-09db-4ff6-9c23-f02ae642b102	2025-06-19 16:29:34.406855-03	2025-06-27 12:57:39.862632-03
c916504c-6af0-4b2c-bf8e-415432291c4e	restaurant_address	Rua Bernardino de Campos, 143 - Centro, Jacareí - SP	string	Endereço do restaurante	02304b73-09db-4ff6-9c23-f02ae642b102	2025-06-19 14:19:05.089059-03	2025-06-27 12:57:39.863588-03
a0a324be-297b-4a6a-af62-b6831228de1d	restaurant_name	William Disk Pizza	string	Nome do restaurante	02304b73-09db-4ff6-9c23-f02ae642b102	2025-06-19 14:19:05.089059-03	2025-06-27 12:57:39.86461-03
ab7bc7c3-aa3c-402d-abfd-38dc99968b1e	restaurant_phone	(12) 3961-3004 / (12) 99636-7326	string	Telefone do restaurante	02304b73-09db-4ff6-9c23-f02ae642b102	2025-06-19 14:19:05.089059-03	2025-06-27 12:57:39.865898-03
f3372dc6-b82e-476e-ac01-a1560495e5e6	secondaryColor	#f97316	string	\N	02304b73-09db-4ff6-9c23-f02ae642b102	2025-06-19 16:29:34.415189-03	2025-06-27 12:57:39.866894-03
aa018827-d71d-4138-9686-6474ed42781d	showBranding	true	string	\N	02304b73-09db-4ff6-9c23-f02ae642b102	2025-06-19 16:29:34.433145-03	2025-06-27 12:57:39.868448-03
06ea6028-5ac2-4e88-b6a8-4161ca435737	showTeamSection	true	string	\N	02304b73-09db-4ff6-9c23-f02ae642b102	2025-06-19 16:29:34.470271-03	2025-06-27 12:57:39.870172-03
b2681d93-ece6-47ba-b22f-c70bae2fae34	storyContent	Em 2010, com muito amor pela culinária italiana e o sonho de criar algo especial, nasceu a Pizza Express...	string	\N	02304b73-09db-4ff6-9c23-f02ae642b102	2025-06-19 16:29:34.452469-03	2025-06-27 12:57:39.871145-03
55408eac-4ec4-4224-92ca-3d9c1beea0ac	aboutDescription	Somos uma pizzaria familiar que nasceu do sonho de compartilhar o verdadeiro sabor da pizza italiana com nossa comunidade.	string	\N	02304b73-09db-4ff6-9c23-f02ae642b102	2025-06-19 16:29:34.446505-03	2025-06-27 12:57:39.468891-03
46a1fd7d-7407-4230-a6b6-ff13d3a0c57c	aboutSubtitle	Tradição e Sabor desde 1990	string	\N	02304b73-09db-4ff6-9c23-f02ae642b102	2025-06-19 16:29:34.440498-03	2025-06-27 12:57:39.828314-03
1abbc2f1-0f08-41c7-8e36-9fb42c2e5f68	aboutTitle	Nossa História	string	\N	02304b73-09db-4ff6-9c23-f02ae642b102	2025-06-19 16:29:34.438033-03	2025-06-27 12:57:39.829291-03
c1b88292-e29c-4380-ad24-e8e564cc1d56	acceptOrders	true	string	\N	02304b73-09db-4ff6-9c23-f02ae642b102	2025-06-19 16:01:48.589034-03	2025-06-27 12:57:39.830155-03
7cf3ce83-2eff-490a-934f-1089e62dcf34	borderRadius	medium	string	\N	02304b73-09db-4ff6-9c23-f02ae642b102	2025-06-19 16:29:34.430003-03	2025-06-27 12:57:39.831038-03
6866fa63-267f-443d-91c1-29012cb77a4f	closingHours	23:00	string	\N	02304b73-09db-4ff6-9c23-f02ae642b102	2025-06-19 16:01:48.582407-03	2025-06-27 12:57:39.831922-03
6997947e-c528-4489-9178-6dc09977f951	customCSS		string	\N	02304b73-09db-4ff6-9c23-f02ae642b102	2025-06-19 16:29:34.435492-03	2025-06-27 12:57:39.833008-03
a64477ed-e60e-43c1-87fb-05700c373734	delivery_fee	5	decimal	Taxa de entrega padrão	02304b73-09db-4ff6-9c23-f02ae642b102	2025-06-19 14:19:05.089059-03	2025-06-27 12:57:39.835879-03
6edcd419-1785-4d4b-9cfa-b7010fc00d34	delivery_time	45	integer	Tempo de entrega em minutos	02304b73-09db-4ff6-9c23-f02ae642b102	2025-06-19 14:19:05.089059-03	2025-06-27 12:57:39.837131-03
b761a47a-7a27-4de3-8bbc-efb0d03140d6	description	A melhor pizza da cidade, entregue na sua porta	string	\N	02304b73-09db-4ff6-9c23-f02ae642b102	2025-06-19 16:01:48.560729-03	2025-06-27 12:57:39.840632-03
4b2dcf2d-a377-48d7-a5a3-9f5fc2df663b	email	williamdiskpizza@gmail.com	string	\N	02304b73-09db-4ff6-9c23-f02ae642b102	2025-06-19 16:01:48.570254-03	2025-06-27 12:57:39.842005-03
6615dca2-e065-4a9e-8c73-1aa3957ef669	storyTitle	Como Tudo Começou	string	\N	02304b73-09db-4ff6-9c23-f02ae642b102	2025-06-19 16:29:34.449904-03	2025-06-27 12:57:39.872072-03
1161286a-95d9-474b-b9c1-7664119f58f9	defaultDeliveryFee	5	string	\N	\N	2025-06-26 22:20:31.901539-03	2025-06-27 12:57:39.834604-03
23a86773-7e8e-4ad5-ad0b-d661bea95263	deliveryAreas	[{"name":"Centro","fee":5.9,"maxDistance":5}]	string	\N	\N	2025-06-26 22:20:31.9035-03	2025-06-27 12:57:39.838244-03
66d95dea-9d9a-4b55-90d5-9463c4a88ff1	deliveryEnabled	true	string	\N	\N	2025-06-26 22:20:31.896301-03	2025-06-27 12:57:39.839424-03
87f70bf4-0f0e-4474-8326-74d78cafbece	estimatedDeliveryTime	40	string	\N	\N	2025-06-26 22:20:31.90288-03	2025-06-27 12:57:39.843175-03
1f3db1aa-214e-4858-804d-afdec6576c0e	freeDeliveryMinimum	100	string	\N	\N	2025-06-26 22:20:31.90069-03	2025-06-27 12:57:39.852903-03
b6a8df4b-26d0-4ccf-a735-66477004bb02	logo_url	/uploads/1750436498411-ljhqanj7s2b.png	string	\N	02304b73-09db-4ff6-9c23-f02ae642b102	2025-06-20 13:05:53.992523-03	2025-06-27 12:57:39.858483-03
b9e9e6fc-8cb9-4309-80e4-2d6b21ee2180	maxDeliveryDistance	10	string	\N	\N	2025-06-26 22:20:31.90219-03	2025-06-27 12:57:39.859661-03
e1c94264-b017-4eee-b777-a34c91a91f38	teamMembers	{"{\\"id\\":\\"1\\",\\"name\\":\\"Marco Rossi\\",\\"role\\":\\"Chef Pizzaiolo\\",\\"description\\":\\"Com mais de 15 anos de experiência, Marco é o responsável por manter a tradição e qualidade de nossas pizzas.\\",\\"imageUrl\\":\\"/placeholder.svg?height=300&width=300\\"}","{\\"id\\":\\"2\\",\\"name\\":\\"Ana Silva\\",\\"role\\":\\"Gerente Geral\\",\\"description\\":\\"Ana cuida de toda a operação, garantindo que cada cliente tenha a melhor experiência possível.\\",\\"imageUrl\\":\\"/placeholder.svg?height=300&width=300\\"}","{\\"id\\":\\"3\\",\\"name\\":\\"Carlos Santos\\",\\"role\\":\\"Coordenador de Delivery\\",\\"description\\":\\"Carlos lidera nossa equipe de entrega, assegurando que sua pizza chegue quentinha e no tempo certo.\\",\\"imageUrl\\":\\"/placeholder.svg?height=300&width=300\\"}"}	string	\N	02304b73-09db-4ff6-9c23-f02ae642b102	2025-06-19 16:29:34.473347-03	2025-06-27 12:57:39.87306-03
\.


--
-- TOC entry 4981 (class 0 OID 16618)
-- Dependencies: 220
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, name, description, active, created_at, updated_at, sort_order, image) FROM stdin;
edd3f631-c717-4c54-8490-e9cc72fcd1f2	Sobremesas	Doces e sobremesas deliciosas	f	2025-06-19 14:19:05.089059-03	2025-06-27 12:51:57.763318-03	4	\N
8da7e944-438e-4bb0-994c-b198d65011c8	Bebidas	Refrigerantes, sucos e outras bebidas	t	2025-06-19 14:19:05.089059-03	2025-06-22 12:05:41.07696-03	3	\N
73c3475e-6985-46c6-a5e6-6660a4e84f2d	Categoria Teste	Para teste de exclus�o	f	2025-06-22 14:49:22.196799-03	2025-06-22 15:01:19.853925-03	0	\N
51cd8380-0c81-4ae3-a000-cedf89187799	Pizzas Doce	Pizzas com ingredientes especiais e únicos	t	2025-06-19 14:19:05.089059-03	2025-06-22 15:10:24.250063-03	2	
b9ae3c2e-b542-4e8b-b6d8-7957f7b9f93e	Pizzas Tradicionais	Pizzas com sabores clássicos e tradicionais	t	2025-06-19 14:19:05.089059-03	2025-06-22 15:11:02.654078-03	1	
\.


--
-- TOC entry 4987 (class 0 OID 16751)
-- Dependencies: 226
-- Data for Name: contact_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contact_messages (id, name, email, phone, subject, message, status, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4986 (class 0 OID 16735)
-- Dependencies: 225
-- Data for Name: customer_addresses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customer_addresses (id, user_id, label, street, number, complement, neighborhood, city, state, zip_code, is_default, created_at, updated_at) FROM stdin;
c24c101b-799f-4ee1-9cae-d29d1eb9ac29	8e66e83e-a62b-47f9-98fb-8e84707fb916	Casa	Avenida Presidente Humberto de Alencar Castelo Branco	379	Apto 12 Bloco C	Conjunto Habitacional Marinho	Jacareí	SP	12321-150	t	2025-06-20 14:30:57.62901-03	2025-06-20 14:30:57.62901-03
402eb107-fdf0-46fa-a711-088030c10e20	8ab82e95-c2c9-4671-a0d6-8a6fca88a862	Casa	Avenida Presidente Humberto de Alencar Castelo Branco	379		Conjunto Habitacional Marinho	Jacareí	SP	12321-150	t	2025-06-21 08:19:25.184661-03	2025-06-21 08:19:25.184661-03
c16f593e-22da-49a2-88c2-3d483aea4a82	02304b73-09db-4ff6-9c23-f02ae642b102	Casa	Rua Santa Helena	242		São João	Jacareí	SP	12322-550	t	2025-06-22 21:39:17.124887-03	2025-06-22 21:39:17.124887-03
a9ebffd2-667a-4e52-87f0-baf18e313b0a	a2dba518-c861-47a4-a2b6-58f1fbff9b29	Casa	Rua Santa Helena	379	Apto 12 Bloco C	São João	Jacareí	SP	12322-550	t	2025-06-26 06:33:58.933422-03	2025-06-26 06:33:58.933422-03
\.


--
-- TOC entry 4991 (class 0 OID 16821)
-- Dependencies: 230
-- Data for Name: drivers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.drivers (id, profile_id, name, email, phone, vehicle_type, vehicle_plate, status, current_location, total_deliveries, average_rating, average_delivery_time, created_at, updated_at, last_active_at, active, deleted_at) FROM stdin;
7fae2526-971d-4084-aac0-24bd052abef7	\N	Pedro Costa	pedro.costa@williamdiskpizza.com	(11) 99999-4444	motorcycle	GHI-9012	offline	Pinheiros - São Paulo/SP	98	4.5	30	2025-06-21 12:19:02.6715-03	2025-06-22 15:35:36.845785-03	2025-06-21 12:19:02.6715-03	f	\N
7d70d6ac-6838-447a-b3f8-2e75b6407e91	\N	João Santos	joao.santos@williamdiskpizza.com	(11) 99999-2222	motorcycle	DEF-5678	busy	Jardins - São Paulo/SP	189	4.6	28	2025-06-21 12:19:02.6715-03	2025-06-22 20:50:07.183164-03	2025-06-22 09:21:22.385509-03	f	\N
3423436e-e3f2-4fa6-a9d6-c395e1f3c0da	\N	Carlos Silva	carlos.silva@williamdiskpizza.com	(11) 99999-1111	motorcycle	ABC-1234	busy	Centro - São Paulo/SP	245	4.8	25	2025-06-21 12:19:02.6715-03	2025-06-22 20:50:10.776752-03	2025-06-21 19:22:14.059616-03	f	\N
817c6e76-1a45-4812-80a2-dcaf67da2779	\N	Maria Oliveira	maria.oliveira@williamdiskpizza.com	(11) 99999-3333	motorcycle	BIC-001	available	Jacareí	156	4.9	22	2025-06-21 12:19:02.6715-03	2025-06-22 21:01:53.503953-03	2025-06-22 21:01:53.503953-03	t	\N
c3d00554-412a-4668-9a8d-a79f6528205d	\N	Pedro	pedro@pedro.com.br	12999999999	motorcycle	ABC-1234	offline	Centro	0	0.0	0	2025-06-26 22:22:53.202874-03	2025-06-26 22:22:53.202874-03	2025-06-26 22:22:53.202874-03	t	\N
\.


--
-- TOC entry 4984 (class 0 OID 16696)
-- Dependencies: 223
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_items (id, order_id, product_id, quantity, unit_price, total_price, size, toppings, special_instructions, created_at, half_and_half, name) FROM stdin;
e499e497-c097-4753-9d42-c5ed57fe5695	b4855ac6-e4cf-4b9a-84d6-79d1ae2aec84	f3c92d85-b3eb-4708-b5f0-43fa89f114c4	1	67.00	67.00	\N	[]	\N	2025-06-21 10:41:37.707804-03	\N	\N
ae56c055-f439-4274-961e-59cfea60c3d9	46c7dc9a-f9b8-46fa-8394-789b1243332d	f3c92d85-b3eb-4708-b5f0-43fa89f114c4	1	67.00	67.00	\N	[]	\N	2025-06-21 11:01:01.256532-03	\N	\N
d4b181a8-3765-4ff0-920c-a77e67d9c185	794ea04b-f134-4490-9ae3-d74bb4d96485	f3c92d85-b3eb-4708-b5f0-43fa89f114c4	1	77.00	77.00	\N	[]	\N	2025-06-21 17:46:30.781102-03	\N	\N
a550db74-ddf1-4210-9f4b-b2b697db2169	1812eaf6-ecc7-4cf4-a2f1-b58acd45446c	f3c92d85-b3eb-4708-b5f0-43fa89f114c4	1	92.00	92.00	\N	[]	\N	2025-06-21 18:56:05.383947-03	\N	\N
00445d16-6480-455d-9088-ff21d19f489e	a71892e9-c90a-429c-9168-cc954d8b7679	f3c92d85-b3eb-4708-b5f0-43fa89f114c4	1	67.00	67.00	\N	[]	\N	2025-06-21 18:57:22.815349-03	\N	\N
f4a49818-0bbe-41c8-a1b7-eafaff6e6ef1	4df2af4d-efbb-419d-a715-64cf4025071c	f3c92d85-b3eb-4708-b5f0-43fa89f114c4	1	67.00	67.00	\N	[]	\N	2025-06-22 09:05:54.770567-03	\N	\N
85d9dc51-9823-43d2-939a-5367bc1312c0	6a1c46e3-8191-4603-afbb-b7f3c452ff14	f3c92d85-b3eb-4708-b5f0-43fa89f114c4	1	67.00	67.00	\N	[]	\N	2025-06-22 21:39:39.108545-03	\N	\N
54aa00fb-f99a-4977-966e-5d258bcc24a6	6102d9a3-cfe9-4cdc-b184-be8930ed68bf	f3c92d85-b3eb-4708-b5f0-43fa89f114c4	1	77.00	77.00	\N	[]	\N	2025-06-22 23:37:41.105819-03	\N	\N
1e71d0d9-f31f-4b61-b2ee-d858d243c287	0f904a5a-62b9-4310-b97a-03519cfafffc	1ebf9d0a-31ad-4168-9133-7a20abf0621b	1	57.50	57.50	\N	[]	\N	2025-06-24 13:22:16.266746-03	{"firstHalf": {"toppings": [], "productId": "1ebf9d0a-31ad-4168-9133-7a20abf0621b", "productName": "Completa Simples"}, "secondHalf": {"toppings": [], "productId": "88e7257a-f628-41c7-9be9-fe45c38c9977", "productName": "Portuguesa Simples"}}	Pizza Meio a Meio: Completa Simples / Portuguesa Simples
63fa9024-ddb8-4436-84ca-37d91c5aff68	8d85a707-4123-4847-9a6b-24a117182b3e	f3c92d85-b3eb-4708-b5f0-43fa89f114c4	1	94.50	94.50	\N	[]	SEM CEBOLA	2025-06-24 13:29:57.171455-03	{"firstHalf": {"toppings": ["Mussarela", "Azeitona", "Borda", "Bacon"], "productId": "f3c92d85-b3eb-4708-b5f0-43fa89f114c4", "productName": "Completa Especial"}, "secondHalf": {"toppings": ["Borda Catupiry"], "productId": "70e4725f-6cdb-477e-ae98-a489735b5bbb", "productName": "Portuguesa Especial"}}	Pizza Meio a Meio: Completa Especial / Portuguesa Especial
7739309e-8b98-43a8-bf51-46de4b11fb4d	0240fe0b-ac66-4cc0-be50-2853f27197d3	f3c92d85-b3eb-4708-b5f0-43fa89f114c4	1	94.50	94.50	\N	[]	\N	2025-06-24 20:10:38.865272-03	{"firstHalf": {"toppings": ["Bacon", "Mussarela", "Azeitona", "Borda"], "productId": "f3c92d85-b3eb-4708-b5f0-43fa89f114c4", "productName": "Completa Especial"}, "secondHalf": {"toppings": ["Borda Catupiry"], "productId": "70e4725f-6cdb-477e-ae98-a489735b5bbb", "productName": "Portuguesa Especial"}}	Pizza Meio a Meio: Completa Especial / Portuguesa Especial
4da24c68-675c-49e3-a131-1ef9bbcbd624	77ee1da1-29a2-4c94-a39e-6a8ffaeab434	20e8bde4-1f2d-40a7-8baf-8a62eb5a1b24	1	50.00	50.00	\N	[]	Sem Cebola	2025-06-24 20:37:44.134496-03	\N	Napolitana
92ce973e-670e-43f9-9a3b-5a0eafafc4d7	ed94a549-d008-425d-90b0-e4f454a2d618	f3c92d85-b3eb-4708-b5f0-43fa89f114c4	1	107.00	107.00	\N	[]	Sem Cebola	2025-06-26 19:56:20.18565-03	{"firstHalf": {"toppings": ["Bacon", "Mussarela", "Azeitona"], "productId": "f3c92d85-b3eb-4708-b5f0-43fa89f114c4", "productName": "Completa Especial"}, "secondHalf": {"toppings": ["Borda Catupiry"], "productId": "70e4725f-6cdb-477e-ae98-a489735b5bbb", "productName": "Portuguesa Especial"}}	Pizza Meio a Meio: Completa Especial / Portuguesa Especial
831115fb-ce5e-4296-bc70-7432cf5ffc59	33d0aafb-f60b-49e4-9579-ee6e2269e6fe	f3c92d85-b3eb-4708-b5f0-43fa89f114c4	1	122.00	122.00	\N	[]	Sem Cebola	2025-06-26 20:26:41.081136-03	{"firstHalf": {"toppings": ["Azeitona", "Borda", "Mussarela", "Bacon"], "productId": "f3c92d85-b3eb-4708-b5f0-43fa89f114c4", "productName": "Completa Especial"}, "secondHalf": {"toppings": ["Borda Catupiry"], "productId": "70e4725f-6cdb-477e-ae98-a489735b5bbb", "productName": "Portuguesa Especial"}}	Pizza Meio a Meio: Completa Especial / Portuguesa Especial
68b50777-126f-4c84-85bc-68fe0de5be29	dc0258fe-8cf2-4f0f-8f49-cc03d9b60078	f3c92d85-b3eb-4708-b5f0-43fa89f114c4	1	87.00	87.00	\N	[]	\N	2025-06-26 20:58:18.596077-03	{"firstHalf": {"toppings": ["Azeitona", "Mussarela"], "productId": "f3c92d85-b3eb-4708-b5f0-43fa89f114c4", "productName": "Completa Especial"}, "secondHalf": {"toppings": [], "productId": "3f802a30-c9ce-4c9c-9f9d-794ce19c49f3", "productName": "Mussarela"}}	Pizza Meio a Meio: Completa Especial / Mussarela
d30f00a2-c253-41b8-a70b-499b1f1b4106	030fe715-7066-4a60-bef9-374de59906e9	f3c92d85-b3eb-4708-b5f0-43fa89f114c4	1	87.00	87.00	\N	[]	\N	2025-06-26 21:08:18.657269-03	{"firstHalf": {"toppings": ["Bacon", "Mussarela"], "productId": "f3c92d85-b3eb-4708-b5f0-43fa89f114c4", "productName": "Completa Especial"}, "secondHalf": {"toppings": [], "productId": "88e7257a-f628-41c7-9be9-fe45c38c9977", "productName": "Portuguesa Simples"}}	Pizza Meio a Meio: Completa Especial / Portuguesa Simples
\.


--
-- TOC entry 4985 (class 0 OID 16716)
-- Dependencies: 224
-- Data for Name: order_status_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_status_history (id, order_id, old_status, new_status, changed_by, changed_at, notes) FROM stdin;
f02ee31c-3345-4333-ab29-f242ce5b0802	b4855ac6-e4cf-4b9a-84d6-79d1ae2aec84	RECEIVED	CANCELLED	\N	2025-06-21 11:41:35.621142-03	Pedido Repetido
c1391b55-47f2-4c54-8c09-f50045eb1fe9	46c7dc9a-f9b8-46fa-8394-789b1243332d	RECEIVED	PREPARING	\N	2025-06-21 11:52:04.229823-03	\N
e0d78ef2-3319-4704-8f05-d7be56004365	46c7dc9a-f9b8-46fa-8394-789b1243332d	PREPARING	ON_THE_WAY	\N	2025-06-21 11:56:13.351068-03	\N
473f82fa-9b35-4fb5-9b4a-60384f5f1b85	46c7dc9a-f9b8-46fa-8394-789b1243332d	ON_THE_WAY	DELIVERED	\N	2025-06-21 11:56:57.636404-03	\N
0f6949c4-cafe-4a8a-9d15-bcb0455ef366	794ea04b-f134-4490-9ae3-d74bb4d96485	RECEIVED	PREPARING	\N	2025-06-21 17:47:00.831572-03	\N
91ebc558-2fa1-4f16-8b38-ed0633798569	794ea04b-f134-4490-9ae3-d74bb4d96485	PREPARING	CANCELLED	\N	2025-06-21 18:35:19.480007-03	Pedido Cancelado
c07578d8-5760-482c-a4c2-4eae7816888c	1812eaf6-ecc7-4cf4-a2f1-b58acd45446c	RECEIVED	PREPARING	\N	2025-06-21 18:56:33.949866-03	\N
bbb116b7-0f92-486f-9ccd-0c32d9125cdc	1812eaf6-ecc7-4cf4-a2f1-b58acd45446c	PREPARING	ON_THE_WAY	\N	2025-06-21 18:56:43.45642-03	\N
02c8b6c4-c5d6-407c-84d0-9a8cd90e3309	1812eaf6-ecc7-4cf4-a2f1-b58acd45446c	ON_THE_WAY	DELIVERED	\N	2025-06-21 18:57:02.17214-03	\N
7ad4ded9-d007-4e6f-af11-fd4d6eed8cdc	a71892e9-c90a-429c-9168-cc954d8b7679	RECEIVED	PREPARING	\N	2025-06-21 18:57:38.837596-03	\N
8aa21a2c-4903-4415-9fc2-b340bc589172	a71892e9-c90a-429c-9168-cc954d8b7679	ON_THE_WAY	DELIVERED	\N	2025-06-21 19:23:10.060668-03	\N
a145188b-a71a-4d10-8745-6490eeeaef95	4df2af4d-efbb-419d-a715-64cf4025071c	RECEIVED	PREPARING	\N	2025-06-22 09:06:30.527161-03	\N
e79efe65-32ee-491c-9b12-d9c4e43c18d7	4df2af4d-efbb-419d-a715-64cf4025071c	ON_THE_WAY	DELIVERED	\N	2025-06-22 09:21:43.397365-03	\N
b4620e83-6f23-4261-a92a-4ff663af2f2f	6a1c46e3-8191-4603-afbb-b7f3c452ff14	RECEIVED	PREPARING	\N	2025-06-22 21:40:05.469024-03	\N
0151024c-62fb-4ca1-a4e9-a85e9b3853af	6a1c46e3-8191-4603-afbb-b7f3c452ff14	PREPARING	ON_THE_WAY	\N	2025-06-22 21:40:13.473469-03	\N
9f6447b7-2d32-4577-93b0-c9ac7e85dade	6a1c46e3-8191-4603-afbb-b7f3c452ff14	ON_THE_WAY	DELIVERED	\N	2025-06-22 21:40:20.674935-03	\N
d119698d-72aa-42b4-a969-fd2c3f66003a	6102d9a3-cfe9-4cdc-b184-be8930ed68bf	RECEIVED	PREPARING	\N	2025-06-22 23:38:07.559284-03	\N
abf3149a-d556-4ec0-ac65-ca74df58b790	6102d9a3-cfe9-4cdc-b184-be8930ed68bf	PREPARING	CANCELLED	\N	2025-06-24 13:21:05.297836-03	nenhum
edbff808-33e4-4c6e-8cf7-b242906192ec	0f904a5a-62b9-4310-b97a-03519cfafffc	RECEIVED	PREPARING	\N	2025-06-24 13:22:33.766573-03	\N
bb7128cc-9361-4deb-89d0-f19e0c718915	0f904a5a-62b9-4310-b97a-03519cfafffc	PREPARING	ON_THE_WAY	\N	2025-06-24 13:23:21.436776-03	\N
d6dbefde-05fd-40e8-8aa2-260de332785c	0f904a5a-62b9-4310-b97a-03519cfafffc	ON_THE_WAY	DELIVERED	\N	2025-06-24 13:23:24.8639-03	\N
a0a3243d-430d-454a-b6d7-652ef4876f06	8d85a707-4123-4847-9a6b-24a117182b3e	RECEIVED	PREPARING	\N	2025-06-24 13:31:26.657722-03	\N
a055f9de-e769-4c87-b659-a6de284d7a95	8d85a707-4123-4847-9a6b-24a117182b3e	PREPARING	ON_THE_WAY	\N	2025-06-24 20:10:01.580423-03	\N
a44bb35f-91e1-4d3e-ba68-31e0776dabca	0240fe0b-ac66-4cc0-be50-2853f27197d3	RECEIVED	PREPARING	\N	2025-06-24 20:14:06.774254-03	\N
937137c8-5164-4db4-9ab1-2f5eb0e41126	0240fe0b-ac66-4cc0-be50-2853f27197d3	PREPARING	ON_THE_WAY	\N	2025-06-24 20:18:09.515391-03	\N
12cd8f8d-9b20-4b93-9130-e01208b14d53	0240fe0b-ac66-4cc0-be50-2853f27197d3	ON_THE_WAY	DELIVERED	\N	2025-06-24 20:28:43.489695-03	\N
4ee559ad-96b5-4fdd-ae43-4733a664c300	8d85a707-4123-4847-9a6b-24a117182b3e	ON_THE_WAY	DELIVERED	\N	2025-06-24 20:28:43.705347-03	\N
f1d2924a-df29-4883-bda6-bd32e5de8e58	77ee1da1-29a2-4c94-a39e-6a8ffaeab434	RECEIVED	PREPARING	\N	2025-06-24 20:38:06.82519-03	\N
3a50e58d-8d37-4863-9dda-17b8833a6f47	77ee1da1-29a2-4c94-a39e-6a8ffaeab434	PREPARING	ON_THE_WAY	\N	2025-06-24 20:38:52.619961-03	\N
1011d3d8-7dcc-4510-8577-6cece760074d	77ee1da1-29a2-4c94-a39e-6a8ffaeab434	ON_THE_WAY	DELIVERED	\N	2025-06-24 20:38:53.756197-03	\N
40e8835f-5371-4a3c-9fa2-d5fe24552f03	ed94a549-d008-425d-90b0-e4f454a2d618	RECEIVED	PREPARING	\N	2025-06-26 19:58:51.760976-03	\N
94b1fee3-2db4-4ec3-b4eb-c9af06ee95f5	ed94a549-d008-425d-90b0-e4f454a2d618	PREPARING	ON_THE_WAY	\N	2025-06-26 19:59:19.435044-03	\N
0b5ea4ea-4b2b-4656-b64c-6e7b2fa062c7	ed94a549-d008-425d-90b0-e4f454a2d618	ON_THE_WAY	DELIVERED	\N	2025-06-26 19:59:32.058782-03	\N
a61c3f0d-b9d7-40a4-9a07-903f79f30fbe	33d0aafb-f60b-49e4-9579-ee6e2269e6fe	RECEIVED	PREPARING	\N	2025-06-26 20:39:10.54666-03	\N
f998ca8e-8ac0-454a-bee0-d8755fc7453d	33d0aafb-f60b-49e4-9579-ee6e2269e6fe	PREPARING	ON_THE_WAY	\N	2025-06-26 20:39:52.436871-03	\N
bba33605-49b4-45cf-97d3-09b45d4a871e	33d0aafb-f60b-49e4-9579-ee6e2269e6fe	ON_THE_WAY	DELIVERED	\N	2025-06-26 20:40:09.349372-03	\N
41d65166-0cf0-425f-8c9c-81920d5b0c9d	dc0258fe-8cf2-4f0f-8f49-cc03d9b60078	RECEIVED	PREPARING	\N	2025-06-26 20:58:31.560125-03	\N
4c6d13f6-09f4-4e26-aeaa-fd23467697a7	dc0258fe-8cf2-4f0f-8f49-cc03d9b60078	PREPARING	ON_THE_WAY	\N	2025-06-26 20:58:36.222108-03	\N
50994112-4322-4b2d-85b8-c4d25c56d3af	dc0258fe-8cf2-4f0f-8f49-cc03d9b60078	ON_THE_WAY	DELIVERED	\N	2025-06-26 20:58:42.17055-03	\N
93ee23fd-33d9-4545-a00a-2dc2f0de5340	030fe715-7066-4a60-bef9-374de59906e9	RECEIVED	PREPARING	\N	2025-06-26 21:08:27.104794-03	\N
5dbeb5f1-5fb7-41ea-a106-2b53a8d685d8	030fe715-7066-4a60-bef9-374de59906e9	PREPARING	ON_THE_WAY	\N	2025-06-26 21:08:39.957695-03	\N
936f99f0-e435-4ba5-87e6-1ba42be95ca8	030fe715-7066-4a60-bef9-374de59906e9	ON_THE_WAY	DELIVERED	\N	2025-06-26 21:09:32.348687-03	\N
\.


--
-- TOC entry 4983 (class 0 OID 16677)
-- Dependencies: 222
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, user_id, status, total, subtotal, delivery_fee, discount, payment_method, payment_status, delivery_address, delivery_phone, delivery_instructions, estimated_delivery_time, delivered_at, cancelled_at, cancellation_reason, created_at, updated_at, driver_id, customer_name) FROM stdin;
77ee1da1-29a2-4c94-a39e-6a8ffaeab434	8e66e83e-a62b-47f9-98fb-8e84707fb916	DELIVERED	50.00	50.00	0.00	0.00	PIX	PENDING	Avenida Presidente Humberto de Alencar Castelo Branco, 379, Apto 12 Bloco C - Conjunto Habitacional Marinho, Jacareí/SP - CEP: 12321-150	12992237614	\N	2025-06-24 21:22:44.144-03	2025-06-24 20:38:53.756197-03	\N	\N	2025-06-24 20:37:44.134496-03	2025-06-24 20:38:53.756197-03	\N	
ed94a549-d008-425d-90b0-e4f454a2d618	a2dba518-c861-47a4-a2b6-58f1fbff9b29	DELIVERED	107.00	107.00	0.00	0.00	PIX	PENDING	Manual (Balcão)	12988481224	\N	2025-06-26 20:41:20.19-03	2025-06-26 19:59:32.058782-03	\N	\N	2025-06-26 19:56:20.18565-03	2025-06-26 19:59:32.058782-03	\N	Joice Aparecida
dc0258fe-8cf2-4f0f-8f49-cc03d9b60078	8e66e83e-a62b-47f9-98fb-8e84707fb916	DELIVERED	87.00	87.00	0.00	0.00	PIX	PENDING	Avenida Presidente Humberto de Alencar Castelo Branco, 379 - Apto 12 Bloco C - Conjunto Habitacional Marinho, Jacareí/SP - CEP: 12321-150	12992237614	\N	2025-06-26 21:43:18.6-03	2025-06-26 20:58:42.17055-03	\N	\N	2025-06-26 20:58:18.596077-03	2025-06-26 20:58:42.17055-03	\N	Everton Ferreira
b4855ac6-e4cf-4b9a-84d6-79d1ae2aec84	8e66e83e-a62b-47f9-98fb-8e84707fb916	CANCELLED	67.00	67.00	0.00	0.00	CREDIT_CARD	PENDING	Avenida Presidente Humberto de Alencar Castelo Branco, 379, Apto 12 Bloco C - Conjunto Habitacional Marinho, Jacareí/SP - CEP: 12321-150	(12) 99223-7614	\N	2025-06-21 11:26:37.705-03	\N	2025-06-21 11:41:35.621142-03	\N	2025-06-21 10:41:37.707804-03	2025-06-24 13:50:17.13562-03	\N	Everton Ferreira
46c7dc9a-f9b8-46fa-8394-789b1243332d	8e66e83e-a62b-47f9-98fb-8e84707fb916	DELIVERED	67.00	67.00	0.00	0.00	CREDIT_CARD	PENDING	Avenida Presidente Humberto de Alencar Castelo Branco, 379, Apto 12 Bloco C - Conjunto Habitacional Marinho, Jacareí/SP - CEP: 12321-150		\N	2025-06-21 11:46:01.259-03	2025-06-21 11:56:57.636404-03	\N	\N	2025-06-21 11:01:01.256532-03	2025-06-24 13:50:17.13562-03	\N	Everton Ferreira
794ea04b-f134-4490-9ae3-d74bb4d96485	8e66e83e-a62b-47f9-98fb-8e84707fb916	CANCELLED	77.00	77.00	0.00	0.00	PIX	PENDING	Avenida Presidente Humberto de Alencar Castelo Branco, 379, Apto 12 Bloco C - Conjunto Habitacional Marinho, Jacareí/SP - CEP: 12321-150		\N	2025-06-21 18:31:30.782-03	\N	2025-06-21 18:35:19.480007-03	\N	2025-06-21 17:46:30.781102-03	2025-06-24 13:50:17.13562-03	\N	Everton Ferreira
1812eaf6-ecc7-4cf4-a2f1-b58acd45446c	8e66e83e-a62b-47f9-98fb-8e84707fb916	DELIVERED	92.00	92.00	0.00	0.00	CREDIT_CARD	PENDING	Avenida Presidente Humberto de Alencar Castelo Branco, 379, Apto 12 Bloco C - Conjunto Habitacional Marinho, Jacareí/SP - CEP: 12321-150		\N	2025-06-21 19:41:05.388-03	2025-06-21 18:57:02.17214-03	\N	\N	2025-06-21 18:56:05.383947-03	2025-06-24 13:50:17.13562-03	\N	Everton Ferreira
a71892e9-c90a-429c-9168-cc954d8b7679	8e66e83e-a62b-47f9-98fb-8e84707fb916	DELIVERED	67.00	67.00	0.00	0.00	CREDIT_CARD	PENDING	Avenida Presidente Humberto de Alencar Castelo Branco, 379, Apto 12 Bloco C - Conjunto Habitacional Marinho, Jacareí/SP - CEP: 12321-150		\N	2025-06-21 19:42:22.817-03	2025-06-21 19:23:10.060668-03	\N	\N	2025-06-21 18:57:22.815349-03	2025-06-24 13:50:17.13562-03	3423436e-e3f2-4fa6-a9d6-c395e1f3c0da	Everton Ferreira
4df2af4d-efbb-419d-a715-64cf4025071c	8e66e83e-a62b-47f9-98fb-8e84707fb916	DELIVERED	67.00	67.00	0.00	0.00	CREDIT_CARD	PENDING	Avenida Presidente Humberto de Alencar Castelo Branco, 379, Apto 12 Bloco C - Conjunto Habitacional Marinho, Jacareí/SP - CEP: 12321-150		Sem Cebola	2025-06-22 09:50:54.773-03	2025-06-22 09:21:43.397365-03	\N	\N	2025-06-22 09:05:54.770567-03	2025-06-24 13:50:17.13562-03	7d70d6ac-6838-447a-b3f8-2e75b6407e91	Everton Ferreira
6a1c46e3-8191-4603-afbb-b7f3c452ff14	02304b73-09db-4ff6-9c23-f02ae642b102	DELIVERED	67.00	67.00	0.00	0.00	PIX	PENDING	Rua Santa Helena, 242 - São João, Jacareí/SP - CEP: 12322-550		\N	2025-06-22 22:24:39.11-03	2025-06-22 21:40:20.674935-03	\N	\N	2025-06-22 21:39:39.108545-03	2025-06-24 13:50:17.13562-03	\N	Everton
6102d9a3-cfe9-4cdc-b184-be8930ed68bf	02304b73-09db-4ff6-9c23-f02ae642b102	CANCELLED	77.00	77.00	0.00	0.00	PIX	PENDING	Rua Santa Helena, 242 - São João, Jacareí/SP - CEP: 12322-550		\N	2025-06-23 00:22:41.132-03	\N	2025-06-24 13:21:05.297836-03	\N	2025-06-22 23:37:41.105819-03	2025-06-24 13:50:17.13562-03	\N	Everton
0f904a5a-62b9-4310-b97a-03519cfafffc	02304b73-09db-4ff6-9c23-f02ae642b102	DELIVERED	57.50	57.50	0.00	0.00	PIX	PENDING	Rua Santa Helena, 242 - São João, Jacareí/SP - CEP: 12322-550		\N	2025-06-24 14:07:16.268-03	2025-06-24 13:23:24.8639-03	\N	\N	2025-06-24 13:22:16.266746-03	2025-06-24 13:50:17.13562-03	\N	Everton
0240fe0b-ac66-4cc0-be50-2853f27197d3	02304b73-09db-4ff6-9c23-f02ae642b102	DELIVERED	94.50	94.50	0.00	0.00	PIX	PENDING	Rua Santa Helena, 242 - São João, Jacareí/SP - CEP: 12322-550		\N	2025-06-24 20:55:38.87-03	2025-06-24 20:28:43.489695-03	\N	\N	2025-06-24 20:10:38.865272-03	2025-06-24 20:28:43.489695-03	\N	
8d85a707-4123-4847-9a6b-24a117182b3e	02304b73-09db-4ff6-9c23-f02ae642b102	DELIVERED	94.50	94.50	0.00	0.00	PIX	PENDING	Rua Santa Helena, 242 - São João, Jacareí/SP - CEP: 12322-550		\N	2025-06-24 14:14:57.173-03	2025-06-24 20:28:43.705347-03	\N	\N	2025-06-24 13:29:57.171455-03	2025-06-24 20:28:43.705347-03	\N	Everton
33d0aafb-f60b-49e4-9579-ee6e2269e6fe	8e66e83e-a62b-47f9-98fb-8e84707fb916	DELIVERED	122.00	122.00	0.00	0.00	CASH	PENDING	Avenida Presidente Humberto de Alencar Castelo Branco, 379 - Apto 12 Bloco C - Conjunto Habitacional Marinho, Jacareí/SP - CEP: 12321-150	12992237614	\N	2025-06-26 21:11:41.089-03	2025-06-26 20:40:09.349372-03	\N	\N	2025-06-26 20:26:41.081136-03	2025-06-26 20:40:09.349372-03	\N	Everton Ferreira
030fe715-7066-4a60-bef9-374de59906e9	8e66e83e-a62b-47f9-98fb-8e84707fb916	DELIVERED	87.00	87.00	0.00	0.00	CREDIT_CARD	PENDING	Avenida Presidente Humberto de Alencar Castelo Branco, 379 - Apto 12 Bloco C - Conjunto Habitacional Marinho, Jacareí/SP - CEP: 12321-150	12992237614	\N	2025-06-26 21:53:18.661-03	2025-06-26 21:09:32.348687-03	\N	\N	2025-06-26 21:08:18.657269-03	2025-06-26 21:09:32.348687-03	\N	Everton Ferreira
\.


--
-- TOC entry 4982 (class 0 OID 16629)
-- Dependencies: 221
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, name, description, price, category_id, image, active, created_at, updated_at, available, sizes, toppings, show_image, product_number) FROM stdin;
d61727fc-8371-46e1-beba-d8b56f148a49	Pizza Portuguesa	Molho de tomate, mussarela, presunto, ovos, cebola e azeitonas	38.90	b9ae3c2e-b542-4e8b-b6d8-7957f7b9f93e	\N	f	2025-06-19 14:19:05.089059-03	2025-06-19 16:33:34.546663-03	t	[]	[]	t	\N
7735c113-718c-495f-bfcf-e9e6ee300fdc	Pizza Pepperoni	Molho de tomate, mussarela e pepperoni	35.90	b9ae3c2e-b542-4e8b-b6d8-7957f7b9f93e	\N	f	2025-06-19 14:19:05.089059-03	2025-06-19 16:33:37.446882-03	t	[]	[]	t	\N
aeb1e8d9-1e10-476b-9cd1-ab4aa22ab2e5	Pizza Margherita	Molho de tomate, mussarela e manjericão fresco	32.90	b9ae3c2e-b542-4e8b-b6d8-7957f7b9f93e	\N	f	2025-06-19 14:19:05.089059-03	2025-06-19 16:33:40.980045-03	t	[]	[]	t	\N
05d6d486-ce69-44f9-9927-d7b2dc67b7ef	Pizza Quatro Queijos	Molho de tomate, mussarela, parmesão, gorgonzola e provolone	42.90	51cd8380-0c81-4ae3-a000-cedf89187799	\N	f	2025-06-19 14:19:05.089059-03	2025-06-19 16:33:44.660965-03	t	[]	[]	t	\N
788bee50-a5f2-49c2-be27-e14bfa926cf0	Guaraná Antarctica 350ml	Refrigerante Guaraná Antarctica lata 350ml	5.00	8da7e944-438e-4bb0-994c-b198d65011c8	\N	f	2025-06-19 14:19:05.089059-03	2025-06-19 16:33:47.189218-03	t	[]	[]	t	\N
909f0de7-2a94-447a-8c8c-9e775d2d2524	Coca-Cola 350ml	Refrigerante Coca-Cola lata 350ml	5.00	8da7e944-438e-4bb0-994c-b198d65011c8	\N	f	2025-06-19 14:19:05.089059-03	2025-06-19 16:33:49.991541-03	t	[]	[]	t	\N
4803c0db-267c-453d-ad9e-49eb3cdbe28f	Pizza Nova	Pizza, Pizza, Pizza, Pizza, Pizza, Pizza, Pizza, Pizza, Pizza, Pizza, Pizza, 	19.90	\N	\N	f	2025-06-19 16:56:20.227424-03	2025-06-19 16:57:12.800934-03	t	[]	[]	t	\N
514ddc72-ff2e-4f77-b48c-8db7bce90012	Pizza Nova	Pizza, Pizza, Pizza, Pizza, Pizza, Pizza, Pizza, 	19.90	\N	\N	f	2025-06-19 16:35:08.422139-03	2025-06-19 16:57:15.455536-03	t	[]	[]	t	\N
fb2bf7ec-9df6-44f3-bb8b-ad679dc4024a	PIzza	Pizza	19.90	\N	\N	f	2025-06-19 16:57:29.030462-03	2025-06-19 16:57:44.174378-03	t	[]	[]	t	\N
9a1dfd48-ee97-4aea-933d-d6fa2fcb40ba	Pizza	Pizza	19.90	\N	\N	f	2025-06-19 16:57:59.091603-03	2025-06-19 17:53:08.333686-03	t	[]	[]	t	\N
9009a5f2-8d61-4f71-9143-0acfbdf2dc07	Pizza Nova	Pizza	19.90	b9ae3c2e-b542-4e8b-b6d8-7957f7b9f93e	\N	f	2025-06-19 18:07:50.12272-03	2025-06-19 18:23:25.454696-03	t	[]	[]	t	\N
2c9ee125-e91b-4cd1-9f3a-03d1ece4bd2d	Portuguesa	Mussarela, presunto, calabresa, ovos, cebola, ervilha, molho de tomate, parmesão ralado, azeitonas, azeite e orégano.	67.00	b9ae3c2e-b542-4e8b-b6d8-7957f7b9f93e	\N	f	2025-06-19 20:01:33.530795-03	2025-06-20 13:22:17.945534-03	t	[]	[{"name": "Bacon", "price": 10}]	f	4
172b2318-c419-440a-a856-6bd4c1ace695	Portuguesa Especial	Mussarela, presunto, calabresa, ovos, atum sólido, ervilha, cebola, molho de tomate, parmesão ralado, azeitonas, azeite e orégano.	67.00	\N		f	2025-06-19 19:14:07.246957-03	2025-06-20 13:22:20.800474-03	t	[]	[]	f	3
4a829d87-5441-41d4-8964-ba8dff409b9e	Pizza 1	Pizza	19.90	\N	/uploads/1750368230069-elkynxxvw6u.jpg	f	2025-06-19 18:23:50.770979-03	2025-06-19 19:02:32.709612-03	t	[]	[]	f	\N
31b66066-c89a-4a70-b859-7a5144087520	Completa Especial	Mussarela, presunto, calabresa, ovos, atum sólido, ervilha, palmito, molho de tomate, parmesão ralado, azeitonas, azeite e orégano.	67.00	b9ae3c2e-b542-4e8b-b6d8-7957f7b9f93e	\N	f	2025-06-19 19:02:58.780378-03	2025-06-19 19:12:25.319763-03	t	[]	[]	f	\N
f466a916-0821-4d02-926b-78e71cfb510f	Completa Simples	Mussarela, presunto, calabresa, ovos, palmito, molho de tomate, parmesão ralado, azeitonas, azeite e orégano.	65.00	\N		f	2025-06-19 19:13:40.189873-03	2025-06-20 13:22:22.467778-03	t	[]	[]	f	2
a1605555-2231-42f0-8cf6-5d89ec8de535	Completa Especial	Mussarela, presunto, calabresa, ovos, atum sólido, ervilha, palmito, molho de tomate, parmesão ralado, azeitonas, azeite e orégano.	67.00	b9ae3c2e-b542-4e8b-b6d8-7957f7b9f93e		f	2025-06-19 19:12:58.439405-03	2025-06-20 13:22:24.778211-03	t	[{"name": "Grande", "price": 67}, {"name": "Brotinho", "price": 47}]	[{"name": "Bacon", "price": 10}]	f	1
b9db9c0f-8156-466d-a66d-153a09869d5e	Completa Especial	Mussarela, presunto, calabresa, ovos, atum sólido, ervilha, palmito, molho de tomate, parmesão ralado, azeitonas, azeite e orégano.	67.00	b9ae3c2e-b542-4e8b-b6d8-7957f7b9f93e	\N	f	2025-06-20 13:24:11.589171-03	2025-06-20 13:41:00.859246-03	t	[]	[{"name": "Borda Recheada", "price": 15}]	f	5
21d93268-bd95-4b4e-ae92-c48385e4045f	Completa Simples	Mussarela, presunto, calabresa, ovos, palmito, molho de tomate, parmesão ralado, azeitonas, azeite e orégano.	65.00	b9ae3c2e-b542-4e8b-b6d8-7957f7b9f93e	\N	f	2025-06-20 13:24:48.674302-03	2025-06-20 13:41:03.457468-03	t	[]	[{"name": "Borda Recheada", "price": 15}]	f	6
3f63a261-c0ac-4bb2-9e9c-363845a632e6	Completa Especial	Mussarela, presunto, calabresa, ovos, atum sólido, ervilha, palmito, molho de tomate, parmesão ralado, azeitonas, azeite e orégano.	67.00	b9ae3c2e-b542-4e8b-b6d8-7957f7b9f93e	\N	f	2025-06-20 13:41:27.627489-03	2025-06-20 13:41:37.446906-03	t	[]	[]	f	1
3cbd161c-491d-44af-8a8f-db0ad64b6af5	Completa Especial	Mussarela, presunto, calabresa, ovos, atum sólido, ervilha, palmito, molho de tomate, parmesão ralado, azeitonas, azeite e orégano.	67.00	b9ae3c2e-b542-4e8b-b6d8-7957f7b9f93e	\N	f	2025-06-20 13:42:12.545795-03	2025-06-20 18:54:47.525584-03	t	[]	[]	f	1
1ac94843-b8bf-4c6d-97cd-3ca13e200f9f	Completa Especial	Mussarela, presunto, calabresa, ovos, atum sólido, ervilha, palmito, molho de tomate, parmesão ralado, azeitonas, azeite e orégano.	67.00	b9ae3c2e-b542-4e8b-b6d8-7957f7b9f93e	\N	f	2025-06-20 18:55:07.287824-03	2025-06-21 10:30:25.350882-03	t	[]	[]	f	1
920a75df-3b71-4c28-b62e-c72a5e7aaa3b	Completa Simples	Mussarela, presunto, calabresa, ovos, palmito, molho de tomate, parmesão ralado, azeitonas, azeite e orégano.	65.00	b9ae3c2e-b542-4e8b-b6d8-7957f7b9f93e	\N	f	2025-06-20 18:55:26.522736-03	2025-06-21 10:30:27.348307-03	t	[]	[]	f	2
184df653-d516-4545-9f69-1aa42e25ee8f	Portuguesa Especial	Mussarela, presunto, calabresa, ovos, atum sólido, ervilha, cebola, molho de tomate, parmesão ralado, azeitonas, azeite e orégano.	67.00	b9ae3c2e-b542-4e8b-b6d8-7957f7b9f93e	\N	f	2025-06-20 18:55:46.342053-03	2025-06-21 10:30:29.489618-03	t	[]	[]	f	3
315aba69-32d5-4754-b95b-01cc403b68d3	Portuguesa	Mussarela, presunto, calabresa, ovos, cebola, ervilha, molho de tomate, parmesão ralado, azeitonas, azeite e orégano.	50.00	b9ae3c2e-b542-4e8b-b6d8-7957f7b9f93e	\N	f	2025-06-20 18:56:04.984829-03	2025-06-21 10:30:31.602674-03	t	[]	[]	f	4
f3c92d85-b3eb-4708-b5f0-43fa89f114c4	Completa Especial	Mussarela, presunto, calabresa, ovos, atum sólido, ervilha, palmito, molho de tomate, parmesão ralado, azeitonas, azeite e orégano.	67.00	b9ae3c2e-b542-4e8b-b6d8-7957f7b9f93e	\N	t	2025-06-21 10:31:30.21933-03	2025-06-21 10:31:30.21933-03	t	[]	[{"name": "Bacon", "price": 10}, {"name": "Mussarela", "price": 10}, {"name": "Azeitona", "price": 10}, {"name": "Borda", "price": 15}]	f	1
88e7257a-f628-41c7-9be9-fe45c38c9977	Portuguesa Simples	Mussarela, presunto, ovos, ervilha, cebola, tomate e orégano	50.00	b9ae3c2e-b542-4e8b-b6d8-7957f7b9f93e	\N	t	2025-06-22 10:29:32.236141-03	2025-06-22 10:29:32.236141-03	t	[]	[]	f	4
3f802a30-c9ce-4c9c-9f9d-794ce19c49f3	Mussarela	Mussarela e orégano	45.00	b9ae3c2e-b542-4e8b-b6d8-7957f7b9f93e	\N	t	2025-06-22 10:30:05.760818-03	2025-06-22 10:30:05.760818-03	t	[]	[]	f	5
20e8bde4-1f2d-40a7-8baf-8a62eb5a1b24	Napolitana	Mussarela, rodelas de tomate e orégano	50.00	b9ae3c2e-b542-4e8b-b6d8-7957f7b9f93e	\N	t	2025-06-22 10:30:27.066857-03	2025-06-22 10:30:27.066857-03	t	[]	[]	f	6
a0996226-1aaf-40e2-a447-7e3fff51d221	Coca Cola	Coca Lata	10.00	8da7e944-438e-4bb0-994c-b198d65011c8	\N	t	2025-06-22 10:49:24.654165-03	2025-06-22 10:49:24.654165-03	t	[]	[]	f	7
1ebf9d0a-31ad-4168-9133-7a20abf0621b	Completa Simples	Mussarela, presunto, ovos, ervilha, milho, cebola, tomate e orégano	65.00	b9ae3c2e-b542-4e8b-b6d8-7957f7b9f93e		t	2025-06-22 10:28:44.714307-03	2025-06-24 13:24:34.882164-03	t	[]	[{"name": "Borda", "price": 5}]	f	2
70e4725f-6cdb-477e-ae98-a489735b5bbb	Portuguesa Especial	Mussarela, presunto, ovos, ervilha, cebola, pimentão, tomate e orégano	67.00	b9ae3c2e-b542-4e8b-b6d8-7957f7b9f93e		t	2025-06-22 10:29:07.759242-03	2025-06-24 13:26:10.349441-03	t	[]	[{"name": "Borda Catupiry", "price": 10}]	f	3
\.


--
-- TOC entry 4980 (class 0 OID 16599)
-- Dependencies: 219
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.profiles (id, email, full_name, phone, role, password_hash, email_verified, profile_completed, last_login, created_at, updated_at) FROM stdin;
00000000-0000-0000-0000-000000000001	admin@williamdiskpizza.com	Administrador	\N	admin	$2b$10$rQ7qP8K6wZ.wJBMfNxF7.OQAYQTnLbRvV8pxe2KRHLJy9tT0GQJYm	f	f	\N	2025-06-19 14:19:05.089059-03	2025-06-19 14:19:05.089059-03
8ab82e95-c2c9-4671-a0d6-8a6fca88a862	ettopropaganda@gmail.com	Everton Ferreira	\N	customer	$2b$10$vGv1jO.aPJ.cIZixa3WzW.wRs4rJUe4XwdSoGDNn2kBHzmsY.MUmy	f	f	\N	2025-06-20 18:56:58.692633-03	2025-06-20 18:56:58.692633-03
02304b73-09db-4ff6-9c23-f02ae642b102	ettomkt@gmail.com	Everton	12992237614	admin	$2b$10$YwiRncNwA8usIgDWAvowdenQippU0p2BfdbjVkGWap5iypSz5q9BS	f	f	\N	2025-06-19 15:43:35.167474-03	2025-06-24 20:34:56.027703-03
8e66e83e-a62b-47f9-98fb-8e84707fb916	ettobr@gmail.com	Everton Ferreira	12992237614	customer	$2b$10$m/R7SgktDYO5NqSGJmrpPuqo1XOp3hW6Wn2Jyl8Cv52He6c26WZg2	f	f	\N	2025-06-19 15:11:10.957418-03	2025-06-24 20:37:44.134496-03
a2dba518-c861-47a4-a2b6-58f1fbff9b29	joicephf@gmail.com	Joice Aparecida	12988481224	customer	$2b$10$dumwqGYDqNvNDBwaQNPaIu67quCjN3t.P3cEZQn4pJN1q7kTkhfbm	f	f	\N	2025-06-24 22:34:05.670525-03	2025-06-26 06:33:08.685088-03
\.


--
-- TOC entry 4999 (class 0 OID 0)
-- Dependencies: 229
-- Name: products_number_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.products_number_seq', 7, true);


--
-- TOC entry 4764 (class 2606 OID 16588)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4766 (class 2606 OID 16586)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4804 (class 2606 OID 16773)
-- Name: about_content about_content_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.about_content
    ADD CONSTRAINT about_content_pkey PRIMARY KEY (id);


--
-- TOC entry 4806 (class 2606 OID 16775)
-- Name: about_content about_content_section_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.about_content
    ADD CONSTRAINT about_content_section_key UNIQUE (section);


--
-- TOC entry 4808 (class 2606 OID 16786)
-- Name: admin_settings admin_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_settings
    ADD CONSTRAINT admin_settings_pkey PRIMARY KEY (id);


--
-- TOC entry 4810 (class 2606 OID 16788)
-- Name: admin_settings admin_settings_setting_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_settings
    ADD CONSTRAINT admin_settings_setting_key_key UNIQUE (setting_key);


--
-- TOC entry 4774 (class 2606 OID 16628)
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- TOC entry 4802 (class 2606 OID 16761)
-- Name: contact_messages contact_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT contact_messages_pkey PRIMARY KEY (id);


--
-- TOC entry 4799 (class 2606 OID 16745)
-- Name: customer_addresses customer_addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_addresses
    ADD CONSTRAINT customer_addresses_pkey PRIMARY KEY (id);


--
-- TOC entry 4812 (class 2606 OID 16839)
-- Name: drivers drivers_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drivers
    ADD CONSTRAINT drivers_email_key UNIQUE (email);


--
-- TOC entry 4814 (class 2606 OID 16837)
-- Name: drivers drivers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drivers
    ADD CONSTRAINT drivers_pkey PRIMARY KEY (id);


--
-- TOC entry 4794 (class 2606 OID 16705)
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- TOC entry 4797 (class 2606 OID 16724)
-- Name: order_status_history order_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_status_history
    ADD CONSTRAINT order_status_history_pkey PRIMARY KEY (id);


--
-- TOC entry 4787 (class 2606 OID 16690)
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- TOC entry 4779 (class 2606 OID 16639)
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- TOC entry 4770 (class 2606 OID 16612)
-- Name: profiles profiles_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_email_key UNIQUE (email);


--
-- TOC entry 4772 (class 2606 OID 16610)
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- TOC entry 4775 (class 1259 OID 16856)
-- Name: idx_categories_sort_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_categories_sort_order ON public.categories USING btree (sort_order);


--
-- TOC entry 4800 (class 1259 OID 16804)
-- Name: idx_customer_addresses_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customer_addresses_user_id ON public.customer_addresses USING btree (user_id);


--
-- TOC entry 4815 (class 1259 OID 16851)
-- Name: idx_drivers_profile_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_drivers_profile_id ON public.drivers USING btree (profile_id);


--
-- TOC entry 4816 (class 1259 OID 16850)
-- Name: idx_drivers_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_drivers_status ON public.drivers USING btree (status);


--
-- TOC entry 4788 (class 1259 OID 16819)
-- Name: idx_order_items_half_and_half; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_items_half_and_half ON public.order_items USING btree (((half_and_half IS NOT NULL)));


--
-- TOC entry 4789 (class 1259 OID 16859)
-- Name: idx_order_items_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_items_name ON public.order_items USING btree (name);


--
-- TOC entry 4790 (class 1259 OID 16801)
-- Name: idx_order_items_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_items_order_id ON public.order_items USING btree (order_id);


--
-- TOC entry 4791 (class 1259 OID 16802)
-- Name: idx_order_items_product_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_items_product_id ON public.order_items USING btree (product_id);


--
-- TOC entry 4792 (class 1259 OID 16858)
-- Name: idx_order_items_toppings; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_items_toppings ON public.order_items USING gin (toppings);


--
-- TOC entry 4795 (class 1259 OID 16803)
-- Name: idx_order_status_history_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_status_history_order_id ON public.order_status_history USING btree (order_id);


--
-- TOC entry 4780 (class 1259 OID 16800)
-- Name: idx_orders_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_created_at ON public.orders USING btree (created_at DESC);


--
-- TOC entry 4781 (class 1259 OID 16852)
-- Name: idx_orders_driver_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_driver_id ON public.orders USING btree (driver_id);


--
-- TOC entry 4782 (class 1259 OID 16860)
-- Name: idx_orders_manual_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_manual_type ON public.orders USING btree (delivery_address) WHERE (delivery_address = ANY (ARRAY['Manual (Balcão)'::text, 'Manual (Telefone)'::text]));


--
-- TOC entry 4783 (class 1259 OID 16799)
-- Name: idx_orders_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_status ON public.orders USING btree (status);


--
-- TOC entry 4784 (class 1259 OID 16798)
-- Name: idx_orders_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_user_id ON public.orders USING btree (user_id);


--
-- TOC entry 4785 (class 1259 OID 16818)
-- Name: idx_orders_user_id_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_user_id_created_at ON public.orders USING btree (user_id, created_at DESC);


--
-- TOC entry 4776 (class 1259 OID 16797)
-- Name: idx_products_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_active ON public.products USING btree (active);


--
-- TOC entry 4777 (class 1259 OID 16796)
-- Name: idx_products_category_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_category_id ON public.products USING btree (category_id);


--
-- TOC entry 4767 (class 1259 OID 16794)
-- Name: idx_profiles_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_profiles_email ON public.profiles USING btree (email);


--
-- TOC entry 4768 (class 1259 OID 16795)
-- Name: idx_profiles_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_profiles_role ON public.profiles USING btree (role);


--
-- TOC entry 4830 (class 2620 OID 16817)
-- Name: products trigger_assign_product_number; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_assign_product_number BEFORE INSERT ON public.products FOR EACH ROW EXECUTE FUNCTION public.assign_product_number();


--
-- TOC entry 4833 (class 2620 OID 16854)
-- Name: drivers trigger_update_drivers_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_drivers_updated_at BEFORE UPDATE ON public.drivers FOR EACH ROW EXECUTE FUNCTION public.update_drivers_updated_at();


--
-- TOC entry 4829 (class 2620 OID 16807)
-- Name: categories update_categories_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4832 (class 2620 OID 16809)
-- Name: orders update_orders_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4831 (class 2620 OID 16808)
-- Name: products update_products_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4828 (class 2620 OID 16806)
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4826 (class 2606 OID 16789)
-- Name: admin_settings admin_settings_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_settings
    ADD CONSTRAINT admin_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- TOC entry 4825 (class 2606 OID 16746)
-- Name: customer_addresses customer_addresses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_addresses
    ADD CONSTRAINT customer_addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 4827 (class 2606 OID 16840)
-- Name: drivers drivers_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drivers
    ADD CONSTRAINT drivers_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- TOC entry 4821 (class 2606 OID 16706)
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- TOC entry 4822 (class 2606 OID 16711)
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- TOC entry 4823 (class 2606 OID 16730)
-- Name: order_status_history order_status_history_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_status_history
    ADD CONSTRAINT order_status_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES auth.users(id);


--
-- TOC entry 4824 (class 2606 OID 16725)
-- Name: order_status_history order_status_history_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_status_history
    ADD CONSTRAINT order_status_history_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- TOC entry 4819 (class 2606 OID 16845)
-- Name: orders orders_driver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.drivers(id);


--
-- TOC entry 4820 (class 2606 OID 16691)
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- TOC entry 4818 (class 2606 OID 16640)
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- TOC entry 4817 (class 2606 OID 16613)
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


-- Completed on 2025-06-27 13:21:54

--
-- PostgreSQL database dump complete
--

