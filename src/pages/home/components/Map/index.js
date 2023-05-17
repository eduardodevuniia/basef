import React, { useRef, useEffect, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import mapboxgl from "mapbox-gl";
import { useSelector, useDispatch } from "react-redux";
import ReactDOM from "react-dom";
import Image from "next/image";

import styles from "./Map.module.sass";
import getDistance from "@/utils/getDistance";

const Map = () => {
  const mapRef = useRef(null);
  const dispatch = useDispatch();
  const [map, setMap] = useState(null);
  const maps = useSelector((state) => state.location.maps);
  const pin = require("../pin.svg");
  const loc = require("../loc.svg");
  const [marker, setMarker] = useState(null);

  useEffect(() => {
    mapboxgl.accessToken =
      "pk.eyJ1IjoicnV0aGVybGVzIiwiYSI6ImNsaGF3bnJwMjBsY3kzZm4xcWYza3hka3cifQ.6Fz6MQnPiCgAUvTTyUd9mw";
    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: "mapbox://styles/rutherles/clhcoqnha008x01pecudrduj6",
      center: [-40.2857037, -20.2821915],
      zoom: 17,
      locale: "pt-BR",
      pitch: 40,
      bearing: 20,
      antialias: true,
    });

    setMap(map);
  }, []);

  const makerLoc = (center) => {
    if (marker) {
      marker.remove();
    }

    const el2 = document.createElement("div");
    const originEl = document.createElement("div");
    originEl.className = styles.loc;

    map.setCenter(center);

    ReactDOM.render(
      <Image alt="" className={styles.dot} src={loc} width={60} height={60} />,
      originEl
    );

    el2.appendChild(originEl);

    const newMarker2 = new mapboxgl.Marker({
      element: el2,
      id: "initial",
      anchor: "bottom",
    })
      .setLngLat(center)
      .addTo(map);

    setMarker(newMarker2);
  };

  const handleRoutes = async () => {
    const coordinates = await getDistance(maps.origin, maps.destination);

    makerLoc(maps.destination);

    const routeGeoJSON = {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: coordinates[0].geometry.coordinates,
      },
    };

    if (!map.getSource("route")) {
      map.addSource("route", {
        type: "geojson",
        data: routeGeoJSON,
      });
    } else {
      map.getSource("route").setData(routeGeoJSON);
    }

    if (!map.getLayer("route")) {
      map.addLayer({
        id: "route",
        type: "line",
        source: "route",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#007AFF", // Cor azul semelhante à da Uber
          "line-opacity": 0.8, // Opacidade da linha (valor entre 0 e 1)
          "line-width": {
            base: 1,
            stops: [
              [12, 3], // Espessura da linha em zoom nível 12
              [22, 12], // Espessura da linha em zoom nível 22
            ],
          },
        },
      });
    }
    map.setCenter(maps.destination);
  };

  useEffect(() => {
    if (!map) return;

    switch (maps.status) {
      case "location":
        const el = document.createElement("div");
        const puckEl = document.createElement("div");
        puckEl.className = styles.ping;
        map.setCenter([maps.lng, maps.lat]);

        ReactDOM.render(
          <Image
            alt=""
            className={styles.dot}
            src={pin}
            width={60}
            height={60}
          />,
          puckEl
        );
        el.appendChild(puckEl);

        const newMarker = new mapboxgl.Marker({
          element: el,

          id: "initial",
          anchor: "bottom",
        })
          .setLngLat([maps.lng, maps.lat])
          .addTo(map);

        setMarker(newMarker);

        break;
      case "origin":
        makerLoc(maps.origin);

        break;
      case "destination":
        makerLoc(maps.origin);
        handleRoutes();
        map.setZoom(12);

        break;
      default:
        break;
    }
  }, [maps]);

  return <div className={styles.map} ref={mapRef}></div>;
};

export default Map;
